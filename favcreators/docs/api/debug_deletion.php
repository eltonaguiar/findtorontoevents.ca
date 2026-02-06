<?php
/**
 * Debug why Atsyn keeps coming back after deletion
 */

header('Content-Type: text/plain; charset=utf-8');
echo "=== DEBUGGING: Atsyn/Autsyn Deletion Issue ===\n\n";

require_once dirname(__FILE__) . '/db_connect.php';

if (!isset($conn) || !$conn) {
    die("ERROR: Database not available\n");
}

// Check user_lists for user_id=2
$query = $conn->query("SELECT creators, updated_at FROM user_lists WHERE user_id = 2");
if ($query && $query->num_rows > 0) {
    $row = $query->fetch_assoc();
    $creators = json_decode($row['creators'], true);
    echo "User ID 2 has " . count($creators) . " creators (last updated: {$row['updated_at']})\n\n";
    
    // Look for Atsyn or Autsyn
    foreach ($creators as $c) {
        $name = strtolower($c['name']);
        if (strpos($name, 'atsyn') !== false || strpos($name, 'autsyn') !== false) {
            echo "FOUND IN user_lists:\n";
            echo "  Name: {$c['name']}\n";
            echo "  ID: {$c['id']}\n";
            echo "  Accounts: " . count($c['accounts']) . "\n";
            echo "\n";
        }
    }
} else {
    echo "No user_lists entry found for user_id=2\n";
}

// Check default list (user_id=0)
echo "=== CHECKING DEFAULT LIST (user_id=0) ===\n";
$query0 = $conn->query("SELECT creators FROM user_lists WHERE user_id = 0");
if ($query0 && $query0->num_rows > 0) {
    $row0 = $query0->fetch_assoc();
    $default_creators = json_decode($row0['creators'], true);
    echo "Default list has " . count($default_creators) . " creators\n\n";
    
    foreach ($default_creators as $c) {
        $name = strtolower($c['name']);
        if (strpos($name, 'atsyn') !== false || strpos($name, 'autsyn') !== false) {
            echo "FOUND IN DEFAULT LIST:\n";
            echo "  Name: {$c['name']}\n";
            echo "  ID: {$c['id']}\n";
            echo "\n";
        }
    }
} else {
    echo "No default list found\n";
}

// Check creators table (guest list fallback)
echo "=== CHECKING CREATORS TABLE ===\n";
$query2 = $conn->query("SELECT id, name, in_guest_list FROM creators WHERE LOWER(name) LIKE '%atsyn%' OR LOWER(name) LIKE '%autsyn%'");
if ($query2 && $query2->num_rows > 0) {
    while ($row2 = $query2->fetch_assoc()) {
        echo "FOUND IN creators TABLE:\n";
        echo "  ID: {$row2['id']}\n";
        echo "  Name: {$row2['name']}\n";
        echo "  in_guest_list: {$row2['in_guest_list']}\n";
        echo "\n";
    }
} else {
    echo "No matching creators in creators table\n";
}

// Check for any hardcoded injection in get_my_creators.php
echo "=== CHECKING get_my_creators.php FOR HARDCODED CREATORS ===\n";
$gmf = file_get_contents(dirname(__FILE__) . '/get_my_creators.php');
if (strpos($gmf, 'Atsyn') !== false || strpos($gmf, 'atsyn') !== false) {
    echo "WARNING: 'Atsyn' or 'atsyn' found hardcoded in get_my_creators.php!\n";
    // Show relevant lines
    $lines = explode("\n", $gmf);
    foreach ($lines as $i => $line) {
        if (stripos($line, 'atsyn') !== false) {
            echo "  Line " . ($i+1) . ": " . trim($line) . "\n";
        }
    }
} else {
    echo "No hardcoded Atsyn found in get_my_creators.php\n";
}

// Check fix_user2_creators.php
echo "\n=== CHECKING fix_user2_creators.php ===\n";
$fixf = file_get_contents(dirname(__FILE__) . '/fix_user2_creators.php');
if (strpos($fixf, 'Atsyn') !== false || strpos($fixf, 'atsyn') !== false) {
    echo "WARNING: 'Atsyn' found in fix_user2_creators.php!\n";
    $lines = explode("\n", $fixf);
    foreach ($lines as $i => $line) {
        if (stripos($line, 'atsyn') !== false) {
            echo "  Line " . ($i+1) . ": " . trim($line) . "\n";
        }
    }
} else {
    echo "No Atsyn found in fix_user2_creators.php\n";
}

$conn->close();
echo "\n=== END DEBUG ===\n";
?>
