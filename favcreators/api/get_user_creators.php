<?php
// get_user_creators.php - Get the list of creators that a specific user follows
header('Content-Type: application/json');

require_once 'db_config.php';

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
}

// Get user_id from query parameter, default to 2
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 2;

// Get the creators list for this user
$query = "SELECT creators FROM user_lists WHERE user_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['error' => 'No creators found for user_id=' . $user_id, 'user_id' => $user_id, 'creators' => []]);
    exit;
}

$row = $result->fetch_assoc();
$creators_json = $row['creators'];
$creators = json_decode($creators_json, true);

if (!is_array($creators)) {
    echo json_encode(['error' => 'Invalid creators data', 'user_id' => $user_id, 'creators' => []]);
    exit;
}

// Get detailed information for each creator
$creator_ids = array_map(function ($c) {
    return intval($c['id']); }, $creators);
$placeholders = implode(',', array_fill(0, count($creator_ids), '?'));

$detail_query = "SELECT id, name, platform, username, profile_url, avatar_url FROM creators WHERE id IN ($placeholders)";
$detail_stmt = $conn->prepare($detail_query);
$types = str_repeat('i', count($creator_ids));
$detail_stmt->bind_param($types, ...$creator_ids);
$detail_stmt->execute();
$detail_result = $detail_stmt->get_result();

$creator_details = [];
while ($creator = $detail_result->fetch_assoc()) {
    $creator_details[$creator['id']] = $creator;
}

// Merge the list data with creator details
$output = [];
foreach ($creators as $c) {
    $id = intval($c['id']);
    if (isset($creator_details[$id])) {
        $output[] = array_merge($creator_details[$id], [
            'order' => isset($c['order']) ? $c['order'] : null
        ]);
    }
}

echo json_encode([
    'user_id' => $user_id,
    'total_creators' => count($output),
    'creators' => $output
], JSON_PRETTY_PRINT);

$stmt->close();
$detail_stmt->close();
$conn->close();
?>