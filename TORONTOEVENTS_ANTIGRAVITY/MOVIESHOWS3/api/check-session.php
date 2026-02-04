<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Check if user is logged in
if (isset($_SESSION['user'])) {
    echo json_encode(array('user' => $_SESSION['user']));
} else {
    echo json_encode(array('user' => null));
}
?>