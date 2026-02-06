<?php
/**
 * Check if Atsyn is still in the database
 */

header('Content-Type: text/plain; charset=utf-8');

echo "=== CHECKING ATSYN STATUS ===\n\n";

require_once dirname(__FILE__) . '/db_connect.php';

if (!isset($conn) || !$conn) {
    die("ERROR: Database not available\n");
}

// Check user_lists for user_id=2
$query = $conn->query("SELECT creators FROM user_lists WHERE user_id = 2");
if ($query && $query->num_rows > 0) {
    $row = $query->fetch_assoc();
    $creators = json_decode($row['creators'], true);
    
    echo "User ID 2 has " . count($creators) . " creators\n\n";
    
    foreach ($creators as $c) {
        $name_lower = strtolower($c['name']);
        if (strpos($name_lower, 'atsyn') !== false || strpos($name_lower, 'autsyn') !== false) {
            echo "FOUND: {$c['name']} (ID: {$c['id']})\n";
        }
    }
} else {
    echo "No user_lists entry found for user_id=2\n";
}

// Check all PHP files in api folder for hardcoded Atsyn
echo "\n=== CHECKING FOR HARDCODED ATSYN IN PHP FILES ===\n";
$files = glob(dirname(__FILE__) . "/*.php");
foreach ($files as $file) {
    $content = file_get_contents($file);
    if (strpos($content, 'Atsyn') !== false) {
        echo "WARNING: Atsyn found in " . basename($file) . "\n";
    }
}

$conn->close();
?>
