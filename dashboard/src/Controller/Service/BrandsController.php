<?php

namespace Dashboard\Controller\Service;

use Dashboard\Acl\AclPermissionEnum;
use Dashboard\Controller\StandardCRUD;
use Propel\Brand;

class BrandsController extends StandardCRUD
{

    public function run(): void
    {
        parent::run();

        $this->setupCrud(AclPermissionEnum::BRANDS, Brand::class);
    }

}