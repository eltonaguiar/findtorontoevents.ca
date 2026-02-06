<?php
// config.php - Local configuration (not in git)
// This file contains sensitive credentials - do NOT commit to GitHub!

// Google OAuth Credentials
// From: https://console.cloud.google.com/apis/credentials
define('GOOGLE_CLIENT_ID', getenv('GOOGLE_CLIENT_ID') ?: '');
define('GOOGLE_CLIENT_SECRET', getenv('GOOGLE_CLIENT_SECRET') ?: '');

// Database credentials (if needed)
define('DB_HOST', 'mysql.50webs.com');
define('DB_USER', 'ejaguiar1_favcreators');
define('DB_PASS', ''); // <-- Fill in if not using env var
define('DB_NAME', 'ejaguiar1_favcreators');
?>
