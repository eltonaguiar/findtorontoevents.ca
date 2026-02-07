<?php
// Debug version of creator_news_api.php
// Path: /findtorontoevents.ca/fc/api/creator_news_api_debug.php

header('Content-Type: text/plain');

require_once dirname(__FILE__) . '/db_connect.php';

if (!isset($conn) || !$conn) {
    echo "ERROR: Database connection failed\n";
    exit;
}

echo "Database connected OK\n";

// Get parameters
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
echo "user_id = $user_id\n";

// Check if user_lists table exists
$tables_result = $conn->query("SHOW TABLES LIKE 'user_lists'");
if ($tables_result && $tables_result->num_rows > 0) {
    echo "user_lists table exists\n";
} else {
    echo "ERROR: user_lists table does not exist\n";
    exit;
}

// Get user's creator list
$user_list_sql = "SELECT creators FROM user_lists WHERE user_id = $user_id";
echo "SQL: $user_list_sql\n";

$user_list_result = $conn->query($user_list_sql);
if (!$user_list_result) {
    echo "ERROR: " . $conn->error . "\n";
    exit;
}

echo "Query executed OK, rows: " . $user_list_result->num_rows . "\n";

if ($user_list_result->num_rows === 0) {
    echo "No creators found for user_id=$user_id\n";
    exit;
}

$user_list_row = $user_list_result->fetch_assoc();
$creators_json = $user_list_row['creators'];
echo "Creators JSON length: " . strlen($creators_json) . "\n";

$creators_data = json_decode($creators_json, true);
if (!$creators_data) {
    echo "ERROR: Failed to decode JSON\n";
    exit;
}

echo "Decoded " . count($creators_data) . " creators\n";

// Extract creator IDs
$creator_ids = array();
foreach ($creators_data as $creator) {
    if (isset($creator['id'])) {
        $creator_ids[] = $conn->real_escape_string($creator['id']);
    }
}

echo "Creator IDs: " . implode(", ", $creator_ids) . "\n";

if (count($creator_ids) === 0) {
    echo "No creator IDs found\n";
    exit;
}

// Check if creator_mentions table exists
$tables_result = $conn->query("SHOW TABLES LIKE 'creator_mentions'");
if ($tables_result && $tables_result->num_rows > 0) {
    echo "creator_mentions table exists\n";
} else {
    echo "ERROR: creator_mentions table does not exist\n";
    exit;
}

// Build query
$sql = "SELECT 
            cm.id,
            cm.platform,
            cm.content_type,
            cm.content_url,
            cm.title,
            cm.description,
            cm.thumbnail_url,
            cm.author,
            cm.engagement_count,
            cm.posted_at,
            c.id as creator_id,
            c.name as creator_name,
            c.avatar_url as creator_avatar
        FROM creator_mentions cm
        INNER JOIN creators c ON cm.creator_id = c.id
        WHERE c.id IN ('" . implode("','", $creator_ids) . "')
          AND c.follower_count >= 50000
        ORDER BY cm.posted_at DESC LIMIT 50";

echo "\nQuery:\n$sql\n\n";

$result = $conn->query($sql);
if (!$result) {
    echo "ERROR: " . $conn->error . "\n";
    exit;
}

echo "Query executed OK, rows: " . $result->num_rows . "\n";

$items = array();
while ($row = $result->fetch_assoc()) {
    $items[] = $row;
}

echo "\nItems found: " . count($items) . "\n";

$conn->close();
echo "\nDone\n";
?>