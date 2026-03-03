<?php

namespace Dashboard\Controller\Service;

use App\Kernel\Config;
use Dashboard\Acl\AclPermissionEnum;
use Dashboard\Controller\LoggedController;
use InvalidArgumentException;
use PDO;
use Propel\AgentOfferPermission;
use Propel\AgentOfferPermissionQuery;

class OfferPermissionsController extends LoggedController
{
    private const STATUS_PENDING = 'PENDING';
    private const STATUS_ACCEPTED = 'ACCEPTED';
    private const STATUS_REJECTED = 'REJECTED';

    private const CAMPAIGN_STATUS_ACTIVE = 2;

    public function run(): void
    {
        parent::run();

        $this->respond('POST', $this->relativeRoute('/apply-brand'), [$this, 'applyBrand']);
        $this->respond('GET', $this->relativeRoute('/mine'), [$this, 'mine']);

        $this->respond('GET', $this->relativeRoute('/pending'), [$this, 'pending']);
        $this->respond('GET', $this->relativeRoute('/accepted'), [$this, 'accepted']);
        $this->respond('POST', $this->relativeRoute('/[:id]/accept'), [$this, 'accept']);
        $this->respond('POST', $this->relativeRoute('/[:id]/reject'), [$this, 'reject']);
        $this->respond('POST', $this->relativeRoute('/[:id]/revoke-access'), [$this, 'revokeAccess']);
    }

    public function applyBrand($httpRequest = null): void
    {
        $this->canRead(AclPermissionEnum::OFFERS);

        $request = $this->resolveRequestPayload($httpRequest);
        $brandId = (int)($request['brand_id'] ?? $request['brandId'] ?? $request['id'] ?? 0);

        if ($brandId <= 0) {
            throw new InvalidArgumentException('Invalid brand');
        }

        $sql = '
            SELECT o.id
            FROM offer o
            INNER JOIN campaign c ON c.id = o.campaignFK
            WHERE c.brandFK = :brand_id
              AND c.status = :campaign_status_active
        ';

        $stmt = $this->pdo()->prepare($sql);
        $stmt->bindValue(':brand_id', $brandId, PDO::PARAM_INT);
        $stmt->bindValue(':campaign_status_active', self::CAMPAIGN_STATUS_ACTIVE, PDO::PARAM_INT);
        $stmt->execute();

        $offerIds = array_map('intval', array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'id'));

        if (count($offerIds) === 0) {
            throw new InvalidArgumentException('No active offers found for this brand');
        }

        $created = 0;
        $alreadyPending = 0;
        $alreadyAccepted = 0;
        $reactivated = 0;
        $agentId = (int)$this->agent->getId();

        foreach ($offerIds as $offerId) {
            $existingStatusStmt = $this->pdo()->prepare('
                SELECT id, status
                FROM agent_offer_permission
                WHERE agentFK = :agent_id AND offerFK = :offer_id
                LIMIT 1
            ');
            $existingStatusStmt->bindValue(':agent_id', $agentId, PDO::PARAM_INT);
            $existingStatusStmt->bindValue(':offer_id', $offerId, PDO::PARAM_INT);
            $existingStatusStmt->execute();
            $existingRow = $existingStatusStmt->fetch(PDO::FETCH_ASSOC);

            if ($existingRow) {
                $existingStatus = strtoupper(trim((string)($existingRow['status'] ?? '')));
                if ($existingStatus === self::STATUS_ACCEPTED) {
                    $alreadyAccepted++;
                } elseif ($existingStatus === self::STATUS_PENDING) {
                    $alreadyPending++;
                } else {
                    $updateStmt = $this->pdo()->prepare('
                        UPDATE agent_offer_permission
                        SET status = :status_pending, accepted_byFK = NULL
                        WHERE id = :id
                    ');
                    $updateStmt->bindValue(':status_pending', self::STATUS_PENDING, PDO::PARAM_STR);
                    $updateStmt->bindValue(':id', (int)$existingRow['id'], PDO::PARAM_INT);
                    $updateStmt->execute();
                    $reactivated++;
                }
                continue;
            }

            $permission = new AgentOfferPermission();
            $permission->setAgentfk($agentId);
            $permission->setOfferfk($offerId);
            $permission->setStatus(self::STATUS_PENDING);
            $permission->save();
            $created++;
        }

        $this->sendResponse(true, [
            'brand_id' => $brandId,
            'created' => $created,
            'already_pending' => $alreadyPending,
            'already_accepted' => $alreadyAccepted,
            'reactivated' => $reactivated,
        ]);
    }

    public function mine(): void
    {
        $sql = '
            SELECT c.brandFK AS brand_id, aop.status AS status
            FROM agent_offer_permission aop
            INNER JOIN offer o ON o.id = aop.offerFK
            INNER JOIN campaign c ON c.id = o.campaignFK
            WHERE aop.agentFK = :agent_id
        ';

        $stmt = $this->pdo()->prepare($sql);
        $stmt->bindValue(':agent_id', $this->agent->getId(), PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $ranking = [self::STATUS_REJECTED => 1, self::STATUS_PENDING => 2, self::STATUS_ACCEPTED => 3];

        $byBrand = [];
        foreach ($rows as $row) {
            $brandId = (int)$row['brand_id'];
            $status = (string)$row['status'];

            if (!isset($byBrand[$brandId]) || $ranking[$status] > $ranking[$byBrand[$brandId]]) {
                $byBrand[$brandId] = $status;
            }
        }

        $mapping = [];
        foreach ($byBrand as $brandId => $status) {
            $mapping[] = [
                'brand_id' => $brandId,
                'status' => $this->toStatusLabel($status),
            ];
        }

        $this->sendResponse(true, $mapping);
    }

    public function pending(): void
    {
        $this->assertAdminOrOwner();
        $this->sendResponse(true, $this->fetchByStatus(self::STATUS_PENDING));
    }

    public function accepted(): void
    {
        $this->assertAdminOrOwner();
        $this->sendResponse(true, $this->fetchByStatus(self::STATUS_ACCEPTED));
    }

    public function accept($request): void
    {
        $this->changeStatus((int)$request->id, self::STATUS_ACCEPTED);
    }

    public function reject($request): void
    {
        $this->changeStatus((int)$request->id, self::STATUS_REJECTED);
    }

    public function revokeAccess($request): void
    {
        $this->changeStatus((int)$request->id, self::STATUS_REJECTED, self::STATUS_ACCEPTED);
    }

    private function fetchByStatus(string $status): array
    {
        $sql = '
            SELECT
                aop.id,
                aop.status,
                aop.created_at,
                aop.updated_at,
                a.id AS agent_id,
                a.username AS agent_username,
                a.email AS agent_email,
                o.id AS offer_id,
                o.name AS offer_name,
                c.identifier AS offer_identifier,
                c.brandFK AS offer_brand_id,
                ap.id AS approved_by_id,
                ap.username AS approved_by_username,
                ap.email AS approved_by_email
            FROM agent_offer_permission aop
            INNER JOIN agent a ON a.id = aop.agentFK
            INNER JOIN offer o ON o.id = aop.offerFK
            INNER JOIN campaign c ON c.id = o.campaignFK
            LEFT JOIN agent ap ON ap.id = aop.accepted_byFK
            WHERE aop.status = :status_value
            ORDER BY aop.updated_at DESC, aop.created_at DESC
        ';

        $stmt = $this->pdo()->prepare($sql);
        $stmt->bindValue(':status_value', $status, PDO::PARAM_STR);
        $stmt->execute();

        $rows = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $rows[] = [
                'id' => (int)$row['id'],
                'status' => $this->toStatusLabel((string)$row['status']),
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
                'agent' => [
                    'id' => (int)$row['agent_id'],
                    'username' => $row['agent_username'],
                    'email' => $row['agent_email'],
                ],
                'offer' => [
                    'id' => (int)$row['offer_id'],
                    'name' => $row['offer_name'],
                    'identifier' => $row['offer_identifier'],
                    'brandFK' => (int)$row['offer_brand_id'],
                ],
                'approved_by' => [
                    'id' => (int)($row['approved_by_id'] ?? 0),
                    'username' => $row['approved_by_username'],
                    'email' => $row['approved_by_email'],
                    'display_name' => $this->buildDisplayName(
                        $row['approved_by_username'] ?? null,
                        $row['approved_by_email'] ?? null
                    ),
                ],
            ];
        }

        return $rows;
    }

    private function buildDisplayName(?string $username, ?string $email): ?string
    {
        $username = trim((string)($username ?? ''));
        if ($username !== '') {
            return $username;
        }

        $email = trim((string)($email ?? ''));
        if ($email !== '' && str_contains($email, '@')) {
            return explode('@', $email)[0];
        }

        return $email !== '' ? $email : null;
    }

    private function changeStatus(int $id, string $status, string $currentStatus = self::STATUS_PENDING): void
    {
        $this->assertAdminOrOwner();

        $permission = AgentOfferPermissionQuery::create()->findOneById($id);
        if (!$permission) {
            throw new InvalidArgumentException('Permission request not found');
        }

        $agentId = (int)$permission->getAgentfk();
        $brandStmt = $this->pdo()->prepare('
            SELECT c.brandFK AS brand_id
            FROM offer o
            INNER JOIN campaign c ON c.id = o.campaignFK
            WHERE o.id = :offer_id
            LIMIT 1
        ');
        $brandStmt->bindValue(':offer_id', (int)$permission->getOfferfk(), PDO::PARAM_INT);
        $brandStmt->execute();
        $brandId = (int)($brandStmt->fetchColumn() ?: 0);

        if ($brandId <= 0) {
            throw new InvalidArgumentException('Offer/campaign not found for this request');
        }

        $sql = '
            UPDATE agent_offer_permission aop
            INNER JOIN offer o ON o.id = aop.offerFK
            INNER JOIN campaign c ON c.id = o.campaignFK
            SET aop.status = :new_status,
                aop.accepted_byFK = :accepted_by
            WHERE aop.agentFK = :agent_id
              AND c.brandFK = :brand_id
              AND aop.status = :current_status
        ';

        $stmt = $this->pdo()->prepare($sql);
        $stmt->bindValue(':new_status', $status, PDO::PARAM_STR);
        $stmt->bindValue(':accepted_by', $status === self::STATUS_ACCEPTED ? (int)$this->agent->getId() : null, $status === self::STATUS_ACCEPTED ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':agent_id', $agentId, PDO::PARAM_INT);
        $stmt->bindValue(':brand_id', $brandId, PDO::PARAM_INT);
        $stmt->bindValue(':current_status', $currentStatus, PDO::PARAM_STR);
        $stmt->execute();

        $this->sendResponse(true, [
            'id' => $permission->getId(),
            'status' => $this->toStatusLabel($status),
            'updated_requests' => $stmt->rowCount(),
            'agent_id' => $agentId,
            'brand_id' => $brandId,
        ]);
    }

    private function assertAdminOrOwner(): void
    {
        $role = $this->agent->getRole();
        $code = strtolower((string)($role?->getCode() ?? ''));

        if (!in_array($code, ['admin', 'owner'], true)) {
            throw new InvalidArgumentException('Only admin/owner can manage requests');
        }
    }

    private function toStatusLabel(string $status): string
    {
        return in_array($status, [self::STATUS_PENDING, self::STATUS_ACCEPTED, self::STATUS_REJECTED], true)
            ? $status
            : self::STATUS_PENDING;
    }

    private function resolveRequestPayload($httpRequest = null): array
    {
        $request = $this->getRequestBody(true) ?: [];
        if (!is_array($request)) {
            $request = (array)$request;
        }

        if (count($request) === 0 && $httpRequest !== null && method_exists($httpRequest, 'paramsPost')) {
            $request = (array)$httpRequest->paramsPost()->all();
        }

        if (count($request) === 0 && $httpRequest !== null && method_exists($httpRequest, 'body')) {
            $raw = trim((string)$httpRequest->body());
            if ($raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $request = $decoded;
                } else {
                    parse_str($raw, $formData);
                    if (is_array($formData) && count($formData) > 0) {
                        $request = $formData;
                    }
                }
            }
        }

        if (count($request) === 0) {
            $raw = trim((string)file_get_contents('php://input'));
            if ($raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $request = $decoded;
                } else {
                    parse_str($raw, $formData);
                    if (is_array($formData) && count($formData) > 0) {
                        $request = $formData;
                    }
                }
            }
        }

        if (count($request) === 0) {
            $request = $_POST ?? [];
        }

        return is_array($request) ? $request : [];
    }

    private function pdo(): PDO
    {
        $pdo = new PDO(Config::DB_dsn(), Config::DB_user(), Config::DB_password());
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    }
}
