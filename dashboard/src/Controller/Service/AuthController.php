<?php

namespace Dashboard\Controller\Service;

use Dashboard\Services\AgentAuthService;
use Propel\BrandQuery;
use Propel\Map\BrandTableMap;
use Throwable;
use Propel\Runtime\Exception\PropelException;
use Dashboard\Controller\AbstractController;

class AuthController extends AbstractController
{
	public function run(): void
    {
	    parent::run();
		$this->respond("POST", $this->relativeRoute(), [$this, "login"]);
	}
	
	/**
	 * @throws PropelException
	 * @throws Throwable
	 */
	public function login() {
		
		$request = $this->getRequestBody();

		$session = AgentAuthService::loginWithUsernameAndPassword($request->username, $request->password);
		
		$agent          = $session->getAgent();
        $agent_options  = $agent->getOptions();
		$permissions    = $agent->getRole();

//        $event = new AgentLoginEvent($agent);
//        Bootstrap::$dispatcher->dispatch($event);

        $brands = [];
        if(isset($agent_options['brands'])){
            $brands = BrandQuery::create()->filterByStatus(BrandTableMap::COL_STATUS_ENABLED)->findById($agent_options['brands']);
            $mapping = [];
            foreach ($brands as $brand){
                $mapping[] = [
                    "id"            => $brand->getId(),
                    "name"          => $brand->getName(),
                    "identifier"    => $brand->getIdentifier()
                ];
            }
            $brands = $mapping;
        }
		
		$this->sendResponse(true, [
            "agent"     => [
                "id"            => $agent->getId(),
                "username"      => $agent->getUsername(),
                "email"         => $agent->getEmail(),
                "role"          => $permissions->getName()
            ],
            "token"     => $session->getToken(),
            "brands"    => $brands
        ]);
		
	}
}
