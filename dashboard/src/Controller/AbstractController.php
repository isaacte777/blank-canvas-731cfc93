<?php

namespace Dashboard\Controller;

use App\Kernel\Controllers\BaseController;
use App\Kernel\Controllers\ControllerInterface;
use Throwable;

abstract class AbstractController extends BaseController implements ControllerInterface
{

    public function run(): void
    {
        set_exception_handler(function (Throwable $e) {
            error_log("ERROR: " . $e->getMessage() . " " . $e->getFile() . ":" . $e->getLine());
            $this->sendResponse(false, $e->getMessage());
        });
    }

    protected function sendResponse(bool $status, $message): void
    {
        $this->jsonResponse([
            "status"    => $status,
            "message"   => $message
        ]);
    }

    protected function response_table($table){
        die(json_encode($table));
    }

}