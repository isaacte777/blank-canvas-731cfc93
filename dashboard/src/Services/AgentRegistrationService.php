<?php

namespace Dashboard\Services;

use InvalidArgumentException;
use Propel\Agent;
use Propel\AgentQuery;
use Propel\RoleQuery;

class AgentRegistrationService
{
    public static function register(string $username, string $email, string $password, string $roleCode): Agent
    {
        $username = trim($username);
        $email = trim(strtolower($email));
        $roleCode = trim(strtolower($roleCode));

        if ($username === '' || $email === '' || $password === '') {
            throw new InvalidArgumentException('All fields are required');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email');
        }

        if (strlen($password) < 6) {
            throw new InvalidArgumentException('Password must be at least 6 chars');
        }

        if (!in_array($roleCode, ['admin', 'publisher'], true)) {
            throw new InvalidArgumentException('Invalid role');
        }

        if (AgentQuery::create()->filterByEmail($email)->count() > 0) {
            throw new InvalidArgumentException('Email already exists');
        }

        if (AgentQuery::create()->filterByUsername($username)->count() > 0) {
            throw new InvalidArgumentException('Username already exists');
        }

        $role = RoleQuery::create()->findOneByCode($roleCode);
        if (!$role) {
            throw new InvalidArgumentException('Role not found');
        }

        $agent = new Agent();
        $agent->setUsername($username);
        $agent->setEmail($email);
        $agent->setPassword(Agent::hashPassword($password));
        $agent->setRolefk((int)$role->getId());
        $agent->setType(strtoupper($roleCode) === 'ADMIN' ? 'ADMIN' : 'PUBLISHER');
        $agent->setAccess('ALLOW');
        $agent->setConfirmed('YES');
        $agent->setBalance(0);
        $agent->save();

        return $agent;
    }
}
