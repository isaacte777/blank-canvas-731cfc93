<?php

declare(strict_types=1);

session_abort();

error_reporting(E_ERROR);

/**
 * Define constant with namespace
 */
const APP_NAMESPACE = "Dashboard\\Controller";

/**
 * Define constant with template folder
 */
const VIEWS_TEMPLATE = __DIR__ . "/../templates";

/**
 * Serve custom assets from templates folder
 */
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($requestUri, PHP_URL_PATH);

if ($path === '/custom-theme.css') {
    header('Content-Type: text/css; charset=UTF-8');
    header('Cache-Control: public, max-age=3600');
    readfile(VIEWS_TEMPLATE . '/custom-theme.css');
    exit;
}

if ($path === '/custom-scripts.js') {
    header('Content-Type: application/javascript; charset=UTF-8');
    header('Cache-Control: public, max-age=3600');
    readfile(VIEWS_TEMPLATE . '/custom-scripts.js');
    exit;
}

include __DIR__ . '/../../bootstrap.php';
