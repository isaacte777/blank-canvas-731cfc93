<?php

namespace Dashboard\Controller\Service;

use App\Kernel\Config;
use Dashboard\Acl\AclPermissionEnum;
use Dashboard\Controller\LoggedController;
use Klein\Request;
use PDO;

class CampaignClickAnalyticsController extends LoggedController
{
    public function run(): void
    {
        parent::run();

        $this->respond('GET', $this->relativeRoute('/?'), [$this, 'getList']);
    }

    public function getList(Request $request): void
    {
        $this->canRead(AclPermissionEnum::CAMPAIGNS);

        $filters = $this->buildFilters($request);
        $summary = $this->fetchSummary($filters);
        $countries = $this->fetchCountries($filters);
        $rows = $this->fetchRows($filters);

        $this->sendResponse(true, [
            'rows' => $rows,
            'summary' => $summary,
            'countries' => $countries,
        ]);
    }

    private function buildFilters(Request $request): array
    {
        [$startDate, $endDate] = $this->resolveDateRange($request);
        $groupBy = $request->paramsGet()->get('group_by') ?? [];
        $groupPeriod = (string)($groupBy['period'] ?? 'day');
        $groupCountry = filter_var($groupBy['country'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $country = trim((string)$request->paramsGet()->get('country', ''));

        $roleCode = strtolower((string)($this->agent->getRole()?->getCode() ?? ''));
        $isAdminOrOwner = in_array($roleCode, ['admin', 'owner'], true);

        $where = ['cc.created_at >= :start_date', 'cc.created_at <= :end_date'];
        $params = [
            ':start_date' => [$startDate, PDO::PARAM_STR],
            ':end_date' => [$endDate, PDO::PARAM_STR],
        ];

        if ($country !== '') {
            $where[] = 'cc.visitor_country = :country';
            $params[':country'] = [$country, PDO::PARAM_STR];
        }

        if (!$isAdminOrOwner) {
            $where[] = 'cc.utm_campaign = :utm_campaign';
            $params[':utm_campaign'] = [sprintf('agent_%d', (int)$this->agent->getId()), PDO::PARAM_STR];
        }

        return [
            'where_sql' => implode(' AND ', $where),
            'params' => $params,
            'group_period' => $groupPeriod,
            'group_country' => $groupCountry,
        ];
    }

    private function resolveDateRange(Request $request): array
    {
        $range = (string)$request->paramsGet()->get('range', 'mtd');
        $startDate = $request->paramsGet()->get('start_date');
        $endDate = $request->paramsGet()->get('end_date');

        switch ($range) {
            case 'today':
                return [date('Y-m-d 00:00:00'), date('Y-m-d 23:59:59')];
            case 'yesterday':
                return [date('Y-m-d 00:00:00', strtotime('-1 day')), date('Y-m-d 23:59:59', strtotime('-1 day'))];
            case 'ytd':
                return [date('Y-01-01 00:00:00'), date('Y-m-d 23:59:59')];
            case 'custom':
                $resolvedStart = $startDate ? date('Y-m-d 00:00:00', strtotime((string)$startDate)) : date('Y-m-01 00:00:00');
                $resolvedEnd = $endDate ? date('Y-m-d 23:59:59', strtotime((string)$endDate)) : date('Y-m-d 23:59:59');
                return [$resolvedStart, $resolvedEnd];
            case 'mtd':
            default:
                return [date('Y-m-01 00:00:00'), date('Y-m-d 23:59:59')];
        }
    }

    private function fetchSummary(array $filters): array
    {
        $sql = '
            SELECT
                COUNT(DISTINCT CONCAT(COALESCE(cc.visitor_address, ""), ":", COALESCE(cc.campaignFK, 0))) AS total_clicks,
                COUNT(DISTINCT cc.visitor_address) AS total_visitors,
                COUNT(DISTINCT cc.visitor_country) AS total_countries
            FROM campaign_click cc
            WHERE ' . $filters['where_sql'];

        $stmt = $this->pdo()->prepare($sql);
        $this->bindParams($stmt, $filters['params']);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        return [
            'total_clicks' => (int)($row['total_clicks'] ?? 0),
            'total_visitors' => (int)($row['total_visitors'] ?? 0),
            'total_countries' => (int)($row['total_countries'] ?? 0),
        ];
    }

    private function fetchCountries(array $filters): array
    {
        $sql = '
            SELECT DISTINCT cc.visitor_country AS country
            FROM campaign_click cc
            WHERE ' . $filters['where_sql'] . '
              AND cc.visitor_country IS NOT NULL
              AND cc.visitor_country <> ""
            ORDER BY cc.visitor_country ASC';

        $stmt = $this->pdo()->prepare($sql);
        $this->bindParams($stmt, $filters['params']);
        $stmt->execute();

        return array_values(array_filter(array_map(static function ($row) {
            return $row['country'] ?? null;
        }, $stmt->fetchAll(PDO::FETCH_ASSOC))));
    }

    private function fetchRows(array $filters): array
    {
        [$periodSelect, $periodSortSelect] = $this->getPeriodExpressions($filters['group_period']);
        $countrySelect = $filters['group_country'] ? 'cc.visitor_country AS Country,' : 'NULL AS Country,';
        $countryGroup = $filters['group_country'] ? ', cc.visitor_country' : '';
        $countryOrder = $filters['group_country'] ? ', Country ASC' : '';

        $sql = '
            SELECT
                ' . $periodSelect . ' AS Period,
                ' . $periodSortSelect . ' AS PeriodSort,
                ' . $countrySelect . '
                COUNT(DISTINCT cc.campaignFK) AS Campaigns,
                COUNT(DISTINCT CONCAT(COALESCE(cc.visitor_address, ""), ":", COALESCE(cc.campaignFK, 0))) AS Clicks,
                COUNT(DISTINCT cc.visitor_address) AS Visitors,
                COUNT(DISTINCT cc.visitor_country) AS Countries
            FROM campaign_click cc
            WHERE ' . $filters['where_sql'] . '
            GROUP BY Period, PeriodSort' . $countryGroup . '
            ORDER BY PeriodSort ASC' . $countryOrder;

        $stmt = $this->pdo()->prepare($sql);
        $this->bindParams($stmt, $filters['params']);
        $stmt->execute();

        return array_map(static function ($row) {
            return [
                'Period' => $row['Period'] ?? '-',
                'Country' => $row['Country'] ?: null,
                'Campaigns' => (int)($row['Campaigns'] ?? 0),
                'Clicks' => (int)($row['Clicks'] ?? 0),
                'Visitors' => (int)($row['Visitors'] ?? 0),
                'Countries' => (int)($row['Countries'] ?? 0),
            ];
        }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    private function getPeriodExpressions(string $groupPeriod): array
    {
        return match ($groupPeriod) {
            'week' => [
                "CONCAT(YEAR(DATE_SUB(cc.created_at, INTERVAL WEEKDAY(cc.created_at) DAY)), '-W', LPAD(WEEK(cc.created_at, 1), 2, '0'))",
                'DATE(DATE_SUB(cc.created_at, INTERVAL WEEKDAY(cc.created_at) DAY))',
            ],
            'month' => [
                "DATE_FORMAT(cc.created_at, '%Y-%m')",
                "DATE_FORMAT(cc.created_at, '%Y-%m-01')",
            ],
            'quarter' => [
                "CONCAT(YEAR(cc.created_at), ' Q', QUARTER(cc.created_at))",
                "MAKEDATE(YEAR(cc.created_at), 1) + INTERVAL QUARTER(cc.created_at) QUARTER - INTERVAL 1 QUARTER",
            ],
            'year' => [
                "DATE_FORMAT(cc.created_at, '%Y')",
                "DATE_FORMAT(cc.created_at, '%Y-01-01')",
            ],
            default => [
                "DATE_FORMAT(cc.created_at, '%Y-%m-%d')",
                'DATE(cc.created_at)',
            ],
        };
    }

    private function bindParams(\PDOStatement $stmt, array $params): void
    {
        foreach ($params as $key => [$value, $type]) {
            $stmt->bindValue($key, $value, $type);
        }
    }

    private function pdo(): PDO
    {
        $pdo = new PDO(Config::DB_dsn(), Config::DB_user(), Config::DB_password());
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    }
}
