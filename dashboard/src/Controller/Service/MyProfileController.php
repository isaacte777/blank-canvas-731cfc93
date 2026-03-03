<?php

namespace Dashboard\Controller\Service;

use Dashboard\Controller\LoggedController;
use Propel\BrandQuery;
use Propel\Map\BrandTableMap;

class MyProfileController extends LoggedController
{
    public function run(): void
    {
        parent::run();

        $this->respond("GET", $this->relativeRoute(), [$this, "details"]);
    }

    public function details() {

        $permissions    = $this->agent->getRole();
        $agent_options  = $this->agent->getOptions();

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
                "id"            => $this->agent->getId(),
                "username"      => $this->agent->getUsername(),
                "email"         => $this->agent->getEmail(),
                "role"          => $permissions->getName(),
                "balance"       => $this->agent->getBalance()
            ],
            "token"     => $this->session->getToken(),
            "brands"    => $brands
        ]);
    }

}