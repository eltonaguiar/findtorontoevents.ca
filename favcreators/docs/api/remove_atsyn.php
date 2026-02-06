<?php
/**
 * Remove Atsyn (typo) and Autsyn from all lists
 */

header('Content-Type: text/plain; charset=utf-8');
echo "=== REMOVING ATSYN/AUTSYN ===\n\n";

require_once dirname(__FILE__) . '/db_connect.php';

if (!isset($conn) || !$conn) {
    die("ERROR: Database not available\n");
}

// 1. Remove from user_id=2's list
$query = $conn->query("SELECT creators FROM user_lists WHERE user_id = 2");
if ($query && $query->num_rows > 0) {
    $row = $query->fetch_assoc();
    $creators = json_decode($row['creators'], true);
    
    $original_count = count($creators);
    $new_creators = array();
    $removed = array();
    
    foreach ($creators as $c) {
        $name_lower = strtolower($c['name']);
        if ($name_lower === 'atsyn' || $name_lower === 'autsyn') {
            $removed[] = $c['name'];
            echo "Removing from user_id=2: {$c['name']} (ID: {$c['id']})\n";
        } else {
            $new_creators[] = $c;
        }
    }
    
    if (count($removed) > 0) {
        $json = $conn->real_escape_string(json_encode($new_creators));
        $conn->query("UPDATE user_lists SET creators = '{$json}', updated_at = NOW() WHERE user_id = 2");
        echo "✓ Updated user_id=2: " . count($new_creators) . " creators (was {$original_count})\n\n";
    } else {
        echo "No Atsyn/Autsyn found in user_id=2's list\n\n";
    }
}

// 2. Remove from default list (user_id=0)
$query0 = $conn->query("SELECT creators FROM user_lists WHERE user_id = 0");
if ($query0 && $query0->num_rows > 0) {
    $row0 = $query0->fetch_assoc();
    $default_creators = json_decode($row0['creators'], true);
    
    $original_count = count($default_creators);
    $new_default = array();
    $removed_default = array();
    
    foreach ($default_creators as $c) {
        $name_lower = strtolower($c['name']);
        if ($name_lower === 'atsyn' || $name_lower === 'autsyn') {
            $removed_default[] = $c['name'];
            echo "Removing from default list: {$c['name']} (ID: {$c['id']})\n";
        } else {
            $new_default[] = $c;
        }
    }
    
    if (count($removed_default) > 0) {
        $json = $conn->real_escape_string(json_encode($new_default));
        $conn->query("UPDATE user_lists SET creators = '{$json}', updated_at = NOW() WHERE user_id = 0");
        echo "✓ Updated default list: " . count($new_default) . " creators (was {$original_count})\n\n";
    } else {
        echo "No Atsyn/Autsyn found in default list\n\n";
    }
}

// 3. Remove from creators table
echo "=== CLEANING CREATORS TABLE ===\n";
$conn->query("DELETE FROM creators WHERE LOWER(name) = 'atsyn' OR LOWER(name) = 'autsyn'");
echo "Deleted " . $conn->affected_rows . " rows from creators table\n";

echo "\n=== COMPLETE ===\n";
echo "Atsyn/Autsyn have been removed from all lists.\n";
echo "Refresh your FavCreators page - the creator should be gone.\n";

$conn->close();
?>
