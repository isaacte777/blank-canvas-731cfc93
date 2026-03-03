<?php

namespace Dashboard\Controller\Service;

use Dashboard\Acl\AclOperationEnum;
use Dashboard\Acl\AclPermissionEnum;
use Dashboard\Controller\StandardCRUD;
use Klein\Request;
use Klein\Response;
use Propel\Role;

class RolesController extends StandardCRUD
{
    public function run(): void
    {
        parent::run();

        $this->respond("get", $this->relativeRoute('/permission'), [$this, "getPermission"]);
        $this->respond("get", $this->relativeRoute('/operation'), [$this, "getOperation"]);
        $this->setupCrud(AclPermissionEnum::ROLES, Role::class);
    }

    public function getList(Request $request, Response $response) {
        $dt = $request->paramsGet()->get('ktdatatable');
        $ndt = $request->paramsGet()->get('dt');
        if(!is_null($dt) || !is_null($ndt)){
            $this->getListDatatable($request);
        }else{
            $models = $this->__getList($request);
            $this->sendResponse(true, $models->toArray());
        }
    }

    public function getPermission()
    {
        $this->sendResponse(true, AclPermissionEnum::all());
    }

    public function getOperation()
    {
        $this->sendResponse(true, AclOperationEnum::all());
    }

}