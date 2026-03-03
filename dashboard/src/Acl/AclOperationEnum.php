<?php

namespace Dashboard\Acl;

use ReflectionClass;

class AclOperationEnum
{
	const READ = 'read';
	const WRITE = 'write';

    public static function all(): array
    {
        $reflection = new ReflectionClass(static::class);
        return $reflection->getConstants();
    }
}
