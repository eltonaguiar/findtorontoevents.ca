<?php
// config.php - Configuration (reads from environment or server-level config)
// Secrets should be set via environment variables or server config, not hardcoded here.

// Google OAuth Credentials
// From: https://console.cloud.google.com/apis/credentials
// Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your server environment.
define('GOOGLE_CLIENT_ID', getenv('GOOGLE_CLIENT_ID') ?: '');
define('GOOGLE_CLIENT_SECRET', getenv('GOOGLE_CLIENT_SECRET') ?: '');

// Database credentials (if needed)
define('DB_HOST', getenv('FC_MYSQL_HOST') ?: 'localhost');
define('DB_USER', getenv('FC_MYSQL_USER') ?: 'ejaguiar1_favcreators');
define('DB_PASS', getenv('DB_PASS_SERVER_FAVCREATORS') ?: '');
define('DB_NAME', getenv('FC_MYSQL_DATABASE') ?: 'ejaguiar1_favcreators');
// No closing ?> tag — intentional best practice for PHP-only files
