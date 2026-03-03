<?php

namespace Dashboard\Controller\Service;

use Dashboard\Acl\AclPermissionEnum;
use Dashboard\Controller\StandardCRUD;
use Propel\CampaignClick;

class CampaignClicksController extends StandardCRUD
{

    public function run(): void
    {
        parent::run();

        $this->setupCrud(AclPermissionEnum::CAMPAIGNS, CampaignClick::class);
    }

}