<?php

namespace Dashboard\Controller;

use App\Kernel\Controllers\BaseController;
use App\Kernel\Controllers\ControllerInterface;

class IndexController extends BaseController implements ControllerInterface
{

    public function run(): void
    {

        $this->respond("get", $this->relativeRoute(), function ($request, $response, $service, $app) {
            $index = file_get_contents(sprintf("%s/../../public/index.html", __DIR__));
            die($index);
        });

    }

}