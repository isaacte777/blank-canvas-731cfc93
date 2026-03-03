<?php

namespace Dashboard\Controller\Service;

use App\Kernel\Config;
use Dashboard\Acl\AclPermissionEnum;
use Dashboard\Controller\StandardCRUD;
use Klein\Request;
use PDO;
use Propel\Offer;

class OffersController extends StandardCRUD
{
    protected array $replacing_filters = [
        'DRAFT', 'PENDING', 'ACTIVE'
    ];

    public function run(): void
    {
        parent::run();

        $this->setupCrud(AclPermissionEnum::OFFERS, Offer::class);
    }

    public function getListDatatable(Request $request)
    {
        $pagination = $request->paramsGet()->get('pagination');
        $pageGet = is_null($pagination) ? 1 : (int)$pagination['page'];
        $itemsGet = is_null($pagination) ? 20 : (int)$pagination['perpage'];
        $filters = $request->paramsGet()->get('query') ?? [];

        $page = max(1, $pageGet);
        $items = max(1, $itemsGet);
        $offset = ($page - 1) * $items;

        $statusFilter = $filters['Status'] ?? '';
        $statusMap = ['DRAFT' => 0, 'PENDING' => 1, 'ACTIVE' => 2];

        $roleCode = strtolower((string)$this->agent->getRole()?->getCode());
        $isAdminOrOwner = in_array($roleCode, ['admin', 'owner'], true);

        $where = [];
        $params = [];

        if (isset($statusMap[$statusFilter])) {
            $where[] = 'c.status = :campaign_status';
            $params[':campaign_status'] = [$statusMap[$statusFilter], PDO::PARAM_INT];
        }

        $permissionJoin = '';
        if (!$isAdminOrOwner) {
            $permissionJoin = ' INNER JOIN agent_offer_permission aop ON aop.offerFK = o.id AND aop.agentFK = :agent_id AND aop.status = :permission_status ';
            $params[':agent_id'] = [$this->agent->getId(), PDO::PARAM_INT];
            $params[':permission_status'] = ['ACCEPTED', PDO::PARAM_STR];
        }

        $trackingPermissionSelect = $isAdminOrOwner
            ? 'NULL AS TrackingPermissionId'
            : 'aop.id AS TrackingPermissionId';

        $whereSql = count($where) ? (' WHERE ' . implode(' AND ', $where)) : '';

        $sql = '
            SELECT
                o.id AS Id,
                o.name AS Name,
                c.identifier AS Identifier,
                c.link AS Description,
                c.status AS StatusInt,
                b.name AS BrandName,
                b.logo AS BrandLogo,
                ' . $trackingPermissionSelect . '
            FROM offer o
            INNER JOIN campaign c ON c.id = o.campaignFK
            INNER JOIN brand b ON b.id = c.brandFK
            ' . $permissionJoin . '
            ' . $whereSql . '
            ORDER BY o.id DESC
            LIMIT :limit OFFSET :offset
        ';

        $countSql = '
            SELECT COUNT(*) AS total
            FROM offer o
            INNER JOIN campaign c ON c.id = o.campaignFK
            INNER JOIN brand b ON b.id = c.brandFK
            ' . $permissionJoin . '
            ' . $whereSql . '
        ';

        $pdo = $this->pdo();

        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $key => [$value, $type]) {
            $countStmt->bindValue($key, $value, $type);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => [$value, $type]) {
            $stmt->bindValue($key, $value, $type);
        }
        $stmt->bindValue(':limit', $items, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $statusLabel = [0 => 'DRAFT', 1 => 'PENDING', 2 => 'ACTIVE'];
        $rows = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $rows[] = [
                'Id' => (int)$row['Id'],
                'Name' => $row['Name'],
                'Identifier' => $row['Identifier'],
                'Description' => $row['Description'] ?? '',
                'Status' => $statusLabel[(int)$row['StatusInt']] ?? 'DRAFT',
                'TrackingPermissionId' => isset($row['TrackingPermissionId']) ? (int)$row['TrackingPermissionId'] : null,
                'Brand' => [
                    'Name' => $row['BrandName'],
                    'Logo' => $row['BrandLogo'],
                ],
            ];
        }

        $this->response_table([
            'data' => $rows,
            'meta' => [
                'field' => 'Id',
                'page' => $page,
                'pages' => max(1, (int)ceil($total / $items)),
                'perpage' => $items,
                'sort' => 'desc',
                'total' => $total,
            ]
        ]);
    }

    private function pdo(): PDO
    {
        $pdo = new PDO(Config::DB_dsn(), Config::DB_user(), Config::DB_password());
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    }
}
