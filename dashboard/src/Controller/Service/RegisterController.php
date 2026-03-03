<?php

namespace Dashboard\Controller\Service;

use Dashboard\Controller\AbstractController;
use Dashboard\Services\AgentRegistrationService;

class RegisterController extends AbstractController
{
    public function run(): void
    {
        parent::run();

        $this->respond('POST', $this->relativeRoute(), [$this, 'register']);
    }

    public function register($httpRequest = null): void
    {
        $request = $this->resolveRequestPayload($httpRequest);

        $agent = AgentRegistrationService::register(
            (string)($request['username'] ?? ''),
            (string)($request['email'] ?? ''),
            (string)($request['password'] ?? ''),
            (string)($request['role'] ?? 'publisher')
        );

        $this->sendResponse(true, [
            'id' => (int)$agent->getId(),
            'username' => $agent->getUsername(),
            'email' => $agent->getEmail(),
            'role' => strtolower((string)$agent->getRole()?->getCode()),
        ]);
    }

    private function resolveRequestPayload($httpRequest = null): array
    {
        $request = $this->getRequestBody(true) ?: [];
        if (!is_array($request)) {
            $request = (array)$request;
        }

        if (count($request) === 0 && $httpRequest !== null && method_exists($httpRequest, 'paramsPost')) {
            $request = (array)$httpRequest->paramsPost()->all();
        }

        if (count($request) === 0 && $httpRequest !== null && method_exists($httpRequest, 'body')) {
            $raw = trim((string)$httpRequest->body());
            if ($raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $request = $decoded;
                } else {
                    parse_str($raw, $formData);
                    if (is_array($formData) && count($formData) > 0) {
                        $request = $formData;
                    }
                }
            }
        }

        if (count($request) === 0) {
            $raw = trim((string)file_get_contents('php://input'));
            if ($raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $request = $decoded;
                } else {
                    parse_str($raw, $formData);
                    if (is_array($formData) && count($formData) > 0) {
                        $request = $formData;
                    }
                }
            }
        }

        if (count($request) === 0) {
            $request = $_POST ?? [];
        }

        return is_array($request) ? $request : [];
    }
}
