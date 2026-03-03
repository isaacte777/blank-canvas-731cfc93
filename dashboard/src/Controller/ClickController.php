<?php

namespace Dashboard\Controller;

use App\Kernel\Config;
use App\Kernel\Controllers\BaseController;
use App\Kernel\Controllers\ControllerInterface;
use App\Kernel\GeoIpService;
use GoApp\Service\TrafficSourceDetector;
use Klein\Request;
use Klein\Response;
use PDO;
use Propel\CampaignClick;

class ClickController extends BaseController implements ControllerInterface
{
    private const STATUS_ACCEPTED = 'ACCEPTED';
    private const CAMPAIGN_STATUS_ACTIVE = 2;

    public function run(): void
    {
        $this->respond('get', $this->relativeRoute('/p/[:permission]/[:campaign]'), function (Request $request, Response $response) {
            $permissionStmt = $this->pdo()->prepare('
                SELECT id, agentFK, offerFK
                FROM agent_offer_permission
                WHERE id = :permission_id AND status = :status
                LIMIT 1
            ');
            $permissionStmt->bindValue(':permission_id', (int)$request->permission, PDO::PARAM_INT);
            $permissionStmt->bindValue(':status', self::STATUS_ACCEPTED, PDO::PARAM_STR);
            $permissionStmt->execute();
            $permission = $permissionStmt->fetch(PDO::FETCH_ASSOC);

            if (!$permission) {
                $this->setHttpStatus(404);
                die('Invalid permission');
            }

            $campaign = $this->fetchCampaignForOffer((int)$permission['offerFK'], (string)$request->campaign);
            if (!$campaign) {
                $this->setHttpStatus(404);
                die('Invalid campaign');
            }

            return $this->handleTrackedClick(
                $request,
                $response,
                (int)$campaign['campaign_id'],
                (string)$campaign['campaign_link'],
                (int)$campaign['offer_id'],
                (int)$permission['agentFK']
            );
        });

        $this->respond('get', $this->relativeRoute('/[:offer]/[:campaign]'), function (Request $request, Response $response) {
            $campaign = $this->fetchCampaignForOffer((int)$request->offer, (string)$request->campaign);
            if (!$campaign) {
                $this->setHttpStatus(404);
                die('Invalid campaign');
            }

            return $this->handleTrackedClick(
                $request,
                $response,
                (int)$campaign['campaign_id'],
                (string)$campaign['campaign_link'],
                (int)$campaign['offer_id'],
                null
            );
        });
    }

    private function fetchCampaignForOffer(int $offerId, string $campaignIdentifier): array|false
    {
        $sql = '
            SELECT c.id AS campaign_id, c.link AS campaign_link, o.id AS offer_id
            FROM campaign c
            INNER JOIN offer o ON o.campaignFK = c.id
            WHERE c.status = :campaign_status
              AND o.id = :offer_id
              AND c.identifier = :campaign_identifier
            LIMIT 1
        ';

        $stmt = $this->pdo()->prepare($sql);
        $stmt->bindValue(':campaign_status', self::CAMPAIGN_STATUS_ACTIVE, PDO::PARAM_INT);
        $stmt->bindValue(':offer_id', $offerId, PDO::PARAM_INT);
        $stmt->bindValue(':campaign_identifier', $campaignIdentifier, PDO::PARAM_STR);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            return $row;
        }

        // Fallback: resolve by offer only, so an ambiguous copied identifier does not break the redirect.
        $fallbackSql = '
            SELECT c.id AS campaign_id, c.link AS campaign_link, o.id AS offer_id
            FROM campaign c
            INNER JOIN offer o ON o.campaignFK = c.id
            WHERE c.status = :campaign_status
              AND o.id = :offer_id
            LIMIT 1
        ';

        $fallbackStmt = $this->pdo()->prepare($fallbackSql);
        $fallbackStmt->bindValue(':campaign_status', self::CAMPAIGN_STATUS_ACTIVE, PDO::PARAM_INT);
        $fallbackStmt->bindValue(':offer_id', $offerId, PDO::PARAM_INT);
        $fallbackStmt->execute();

        return $fallbackStmt->fetch(PDO::FETCH_ASSOC);
    }

    private function handleTrackedClick(Request $request, Response $response, int $campaignId, string $campaignLink, int $offerId, ?int $agentId = null)
    {
        $visitorAddress = ClientIp();
        $visitorGeo = GeoIpService::getData($visitorAddress);
        $visitorUa = $request->headers()->get('user_agent');
        $referer = $request->headers()->get('referer');

        $detector = new TrafficSourceDetector();
        $result = $detector->detect();

        if (is_null($visitorGeo)) {
            if (isset($_SERVER['HTTP_CF_IPCOUNTRY'])) {
                $visitorCountry = strtoupper($_SERVER['HTTP_CF_IPCOUNTRY']);
            } else {
                $visitorCountry = 'ES';
            }
        } else {
            $visitorCountry = $visitorGeo['country'];
        }

        $arrivedUtmSource = $request->paramsGet()->get('utm_source', $result['utm']['utm_source']);
        $arrivedUtmMedium = $request->paramsGet()->get('utm_medium', $result['utm']['utm_medium']);
        $arrivedUtmContent = $request->paramsGet()->get('utm_content', $result['utm']['utm_content']);
        $defaultCampaign = is_null($agentId) ? sprintf('offer_%s', $offerId) : sprintf('agent_%s', $agentId);
        $arrivedUtmCampaign = $request->paramsGet()->get('utm_campaign', $defaultCampaign);

        $utm = [
            'utm_source' => $arrivedUtmSource,
            'utm_medium' => $arrivedUtmMedium,
            'utm_campaign' => $arrivedUtmCampaign,
            'utm_content' => $arrivedUtmContent,
        ];
        $utmQuery = http_build_query($utm);

        $redirectLink = str_contains($campaignLink, '?')
            ? $campaignLink . '&' . $utmQuery
            : $campaignLink . '?' . $utmQuery;

        $click = new CampaignClick();
        $click->setCampaignfk($campaignId);
        $click->setOfferfk($offerId);
        $click->setReferer($referer);
        $click->setUtmSource($utm['utm_source']);
        $click->setUtmMedium($utm['utm_medium']);
        $click->setUtmCampaign($utm['utm_campaign']);
        $click->setUtmContent($utm['utm_content']);
        $click->setVisitorCountry($visitorCountry);
        $click->setVisitorAddress(md5($visitorAddress));
        $click->setVisitorUa($visitorUa);
        $click->save();

        return $response->redirect($redirectLink . '&cid=' . $click->getId());
    }

    private function pdo(): PDO
    {
        $pdo = new PDO(Config::DB_dsn(), Config::DB_user(), Config::DB_password());
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    }
}
