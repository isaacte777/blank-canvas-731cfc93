<?php

namespace Dashboard\Controller;

use Dashboard\Acl\AclOperationEnum;
use App\Kernel\Controllers\ControllerInterface;
use InvalidArgumentException;
use Klein\Request;
use Propel\Agent;
use Propel\AgentSession;
use Propel\AgentSessionQuery;
use Propel\Map\AgentSessionTableMap;
use Propel\Map\AgentTableMap;

class LoggedController extends AbstractController implements ControllerInterface
{
    protected AgentSession $session;
    protected Agent $agent;

    protected array $permissions = [];
    protected string $role = '';

    /**
     *
     */
    public function run(): void
    {

        parent::run();

        $this->router->respond(['POST', 'GET', 'PUT', 'DELETE'], "*", function (Request $request) {

            $auth  = $request->headers()->get('Authorization', '');
            $array = explode("Bearer ", $auth);
            $token = end($array);

            if (empty($token)) {
                throw new InvalidArgumentException("No token provided");
            }
            $this->session = AgentSessionQuery::create()->filterByStatus(AgentSessionTableMap::COL_STATUS_VALID)->findOneByToken($token);

            if (empty($this->session)) {
                throw new InvalidArgumentException("Invalid token");
            }

            $this->agent = $this->session->getAgent();

            if (empty($this->agent)) {
                throw new InvalidArgumentException("Invalid agent");
            }

            $access = strtoupper((string)$this->agent->getAccess());
            if (in_array($access, [AgentTableMap::COL_ACCESS_DENY, '1'], true)) {
                throw new InvalidArgumentException("Access denied");
            }

            $role = $this->agent->getRole();
            $this->role = $role->getName();
            $this->permissions = $role->getPermissions();

        });

    }

    /**
     * @param string $permission
     * @throws InvalidArgumentException
     */
    protected function canRead(string $permission) {
        if (in_array(strtolower($this->role), ['owner', 'admin'], true)) {
            return;
        }

        $operation = $this->permissions[$permission] ?? null;
        if (!in_array($operation, [AclOperationEnum::READ, AclOperationEnum::WRITE], true)) {
            throw new InvalidArgumentException(sprintf("Cannot read %s", $permission));
        }
    }

    /**
     * @param string  $permission
     * @throws InvalidArgumentException
     */
    protected function canWrite(string $permission) {
        if (in_array(strtolower($this->role), ['owner', 'admin'], true)) {
            return;
        }

        $operation = $this->permissions[$permission] ?? null;
        if (!in_array($operation, [AclOperationEnum::WRITE], true)) {
            throw new InvalidArgumentException(sprintf("Cannot write %s", $permission));
        }
    }

}
