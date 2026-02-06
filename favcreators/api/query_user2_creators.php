<?php
// Quick script to get user_id=2's creator list
require_once 'db_config.php';

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$user_id = 2;
$query = "SELECT creators FROM user_lists WHERE user_id = $user_id";
$result = $conn->query($query);

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $creators = json_decode($row['creators'], true);

    echo "User ID: $user_id\n";
    echo "Total Creators: " . count($creators) . "\n\n";
    echo "Creator IDs:\n";

    foreach ($creators as $idx => $creator) {
        echo ($idx + 1) . ". ID: " . $creator['id'];
        if (isset($creator['order'])) {
            echo " (order: " . $creator['order'] . ")";
        }
        echo "\n";
    }

    // Get creator names
    $ids = array_map(function ($c) {
        return intval($c['id']); }, $creators);
    $placeholders = implode(',', $ids);

    $name_query = "SELECT id, name, platform, username FROM creators WHERE id IN ($placeholders)";
    $name_result = $conn->query($name_query);

    echo "\n\nCreator Details:\n";
    $creator_map = [];
    while ($creator = $name_result->fetch_assoc()) {
        $creator_map[$creator['id']] = $creator;
    }

    foreach ($creators as $idx => $c) {
        $id = intval($c['id']);
        if (isset($creator_map[$id])) {
            $cr = $creator_map[$id];
            echo ($idx + 1) . ". " . $cr['name'] . " (@" . $cr['username'] . ") - " . $cr['platform'] . "\n";
        }
    }
} else {
    echo "No creators found for user_id=$user_id\n";
}

$conn->close();
?>