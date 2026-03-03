<?php

namespace Dashboard\Acl;

use ReflectionClass;

class AclPermissionEnum
{
    const ADMIN          = 'admin';
    const AGENTS         = 'agents';
    const ROLES          = 'roles';
    const BRANDS         = 'brands';
    const CAMPAIGNS      = 'campaigns';
    const OFFERS         = 'offers';

    public static function all(): array
    {
        $reflection = new ReflectionClass(static::class);
        return $reflection->getConstants();
    }
}
