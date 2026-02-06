<?php
/**
 * Fix creator_mentions schema to use VARCHAR for creator_id
 * This fixes the data mismatch issue where UUIDs were being truncated to integers
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once dirname(__FILE__) . '/db_connect.php';

header('Content-Type: text/plain');

echo "=== Fixing creator_mentions Schema ===\n\n";

if (!isset($conn) || !$conn) {
    echo "ERROR: Database connection failed\n";
    exit;
}

// Step 1: Check current schema
echo "1. Checking current schema...\n";
$schema_sql = "SHOW COLUMNS FROM creator_mentions WHERE Field = 'creator_id'";
$schema_result = $conn->query($schema_sql);
if ($schema_result) {
    $row = $schema_result->fetch_assoc();
    echo "   Current creator_id type: " . $row['Type'] . "\n";
    
    if (strpos($row['Type'], 'int') === false) {
        echo "   Schema already fixed (creator_id is not INT)\n";
    } else {
        echo "   Schema needs fixing (creator_id is INT)\n";
        
        // Step 2: Alter the column type
        echo "\n2. Altering column type...\n";
        $alter_sql = "ALTER TABLE creator_mentions MODIFY COLUMN creator_id VARCHAR(64) NOT NULL";
        if ($conn->query($alter_sql)) {
            echo "   Successfully changed creator_id to VARCHAR(64)\n";
        } else {
            echo "   ERROR altering column: " . $conn->error . "\n";
            exit;
        }
        
        // Step 3: Now fix the data - map truncated IDs to correct creator IDs
        echo "\n3. Fixing data mappings...\n";
        
        // Get all creators to build ID mapping
        $creators_sql = "SELECT id, name FROM creators";
        $creators_result = $conn->query($creators_sql);
        $creators_map = array();
        while ($creator = $creators_result->fetch_assoc()) {
            $full_id = $creator['id'];
            $int_prefix = intval($full_id);
            $creators_map[$int_prefix] = array(
                'id' => $full_id,
                'name' => $creator['name']
            );
        }
        
        // Get all current creator_mentions with integer-looking IDs
        $mentions_sql = "SELECT id, creator_id FROM creator_mentions WHERE creator_id REGEXP '^[0-9]+$'";
        $mentions_result = $conn->query($mentions_sql);
        
        $fixed = 0;
        $skipped = 0;
        
        while ($row = $mentions_result->fetch_assoc()) {
            $mention_id = $row['id'];
            $old_creator_id = $row['creator_id'];
            $new_creator_id = null;
            
            // Try to find the correct creator ID
            $old_int = intval($old_creator_id);
            if (isset($creators_map[$old_int])) {
                $new_creator_id = $creators_map[$old_int]['id'];
                echo "   Fixing ID $mention_id: $old_creator_id -> {$creators_map[$old_int]['name']} ($new_creator_id)\n";
                
                $update_sql = "UPDATE creator_mentions SET creator_id = '" . $conn->real_escape_string($new_creator_id) . "' WHERE id = " . intval($mention_id);
                if ($conn->query($update_sql)) {
                    $fixed++;
                } else {
                    echo "   ERROR updating: " . $conn->error . "\n";
                }
            } else {
                echo "   WARNING: No creator found for ID $old_creator_id (mention_id: $mention_id)\n";
                $skipped++;
            }
        }
        
        echo "\n   Data fix complete:\n";
        echo "   - Fixed: $fixed rows\n";
        echo "   - Skipped: $skipped rows\n";
    }
}

// Verify the fix
echo "\n4. Verifying schema and sample data...\n";
$verify_sql = "SHOW COLUMNS FROM creator_mentions WHERE Field = 'creator_id'";
$verify_result = $conn->query($verify_sql);
if ($verify_result) {
    $row = $verify_result->fetch_assoc();
    echo "   creator_id type is now: " . $row['Type'] . "\n";
}

// Show sample of fixed data
$sample_sql = "SELECT cm.creator_id, c.name, COUNT(*) as count 
               FROM creator_mentions cm 
               LEFT JOIN creators c ON cm.creator_id = c.id 
               GROUP BY cm.creator_id 
               ORDER BY count DESC 
               LIMIT 10";
$sample_result = $conn->query($sample_sql);
echo "\n   Sample data after fix:\n";
while ($row = $sample_result->fetch_assoc()) {
    echo "   - {$row['creator_id']} | {$row['name']} | {$row['count']} items\n";
}

$conn->close();

echo "\n=== Schema Fix Complete ===\n";
?>