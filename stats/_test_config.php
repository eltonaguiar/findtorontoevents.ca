<?php
error_reporting(E_ALL);
ini_set("display_errors","1");
header("Content-Type: text/plain");
echo "Testing config.php include...\n";
include(dirname(__FILE__) . "/../fc/api/config.php");
echo "OK - no parse error\n";
echo "GOOGLE_CLIENT_ID defined: " . (defined('GOOGLE_CLIENT_ID') ? 'yes' : 'no') . "\n";
echo "DB_HOST defined: " . (defined('DB_HOST') ? 'yes' : 'no') . "\n";
?>
