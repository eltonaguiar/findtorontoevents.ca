<?php
// Database connection for MovieShows3
// Using FavCreators database for shared user authentication

$host = 'mysql.50webs.com';
$dbname = 'ejaguiar1_favcreators';
$username = 'ejaguiar1';
$password = '3ADDzY*stB6Qd#$!l1%IIKYuHVRCCupl';

$conn = new mysqli($host, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed']));
}

$conn->set_charset('utf8mb4');
?>