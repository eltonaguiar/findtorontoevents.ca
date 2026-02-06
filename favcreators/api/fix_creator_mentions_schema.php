i<?php
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
        
        // Step 2: Create temporary table with correct schema
        echo "\n2. Creating backup and fixing schema...\n";
        
        // Disable foreign key checks temporarily
        $conn->query("SET FOREIGN_KEY_CHECKS = 0");
        
        // Rename the table
        $rename_sql = "RENAME TABLE creator_mentions TO creator_mentions_backup";
        if ($conn->query($rename_sql)) {
            echo "   Renamed table to creator_mentions_backup\n";
            
            // Create new table with correct schema
            $create_sql = "CREATE TABLE creator_mentions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                creator_id VARCHAR(64) NOT NULL,
                platform VARCHAR(50) NOT NULL,
                content_type VARCHAR(50) NOT NULL,
                content_url TEXT NOT NULL,
                title TEXT,
                description TEXT,
                thumbnail_url TEXT,
                author VARCHAR(255),
                engagement_count INT DEFAULT 0,
                posted_at INT NOT NULL,
                fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_creator_platform (creator_id, platform),
                INDEX idx_posted_at (posted_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
            
            if ($conn->query($create_sql)) {
                echo "   Created new creator_mentions table with VARCHAR creator_id\n";
                
                // Step 3: Migrate data - need to map old integer IDs to correct creator IDs
                echo "\n3. Migrating data...\n";
                
                // Get all creators to build ID mapping
                $creators_sql = "SELECT id, name FROM creators";
                $creators_result = $conn->query($creators_sql);
                $creators_map = array();
                while ($creator = $creators_result->fetch_assoc()) {
                    // Map both full ID and integer prefix
                    $full_id = $creator['id'];
                    $int_prefix = intval($full_id);
                    $creators_map[$int_prefix] = array(
                        'id' => $full_id,
                        'name' => $creator['name']
                    );
                }
                
                // Get all data from backup
                $backup_sql = "SELECT * FROM creator_mentions_backup";
                $backup_result = $conn->query($backup_sql);
                
                $migrated = 0;
                $skipped = 0;
                $errors = 0;
                
                while ($row = $backup_result->fetch_assoc()) {
                    $old_creator_id = $row['creator_id'];
                    $new_creator_id = null;
                    
                    // Try to find the correct creator ID
                    if (isset($creators_map[$old_creator_id])) {
                        $new_creator_id = $creators_map[$old_creator_id]['id'];
                        echo "   Mapping: $old_creator_id -> {$creators_map[$old_creator_id]['name']} ({$new_creator_id})\n";
                    } else {
                        // Try direct match
                        $direct_sql = "SELECT id FROM creators WHERE id = '" . $conn->real_escape_string($old_creator_id) . "'";
                        $direct_result = $conn->query($direct_sql);
                        if ($direct_result && $direct_result->num_rows > 0) {
                            $new_creator_id = $direct_result->fetch_assoc()['id'];
                        }
                    }
                    
                    if ($new_creator_id) {
                        // Insert with correct creator_id
                        $insert_sql = "INSERT INTO creator_mentions 
                            (creator_id, platform, content_type, content_url, title, description, thumbnail_url, author, engagement_count, posted_at, fetched_at)
                            VALUES (
                                '" . $conn->real_escape_string($new_creator_id) . "',
                                '" . $conn->real_escape_string($row['platform']) . "',
                                '" . $conn->real_escape_string($row['content_type']) . "',
                                '" . $conn->real_escape_string($row['content_url']) . "',
                                '" . $conn->real_escape_string($row['title']) . "',
                                '" . $conn->real_escape_string($row['description']) . "',
                                '" . $conn->real_escape_string($row['thumbnail_url']) . "',
                                '" . $conn->real_escape_string($row['author']) . "',
                                " . intval($row['engagement_count']) . ",
                                " . intval($row['posted_at']) . ",
                                '" . $row['fetched_at'] . "'
                            )";
                        
                        if ($conn->query($insert_sql)) {
                            $migrated++;
                        } else {
                            echo "   ERROR inserting: " . $conn->error . "\n";
                            $errors++;
                        }
                    } else {
                        echo "   WARNING: No creator found for ID $old_creator_id\n";
                        $skipped++;
                    }
                }
                
                echo "\n   Migration complete:\n";
                echo "   - Migrated: $migrated rows\n";
                echo "   - Skipped: $skipped rows\n";
                echo "   - Errors: $errors rows\n";
                
                // Step 4: Drop backup table
                echo "\n4. Cleaning up...\n";
                $conn->query("DROP TABLE creator_mentions_backup");
                echo "   Dropped backup table\n";
                
            } else {
                echo "   ERROR creating new table: " . $conn->error . "\n";
                // Restore backup
                $conn->query("RENAME TABLE creator_mentions_backup TO creator_mentions");
            }
            
            // Re-enable foreign key checks
            $conn->query("SET FOREIGN_KEY_CHECKS = 1");
            
        } else {
            echo "   ERROR renaming table: " . $conn->error . "\n";
        }
    }
}

// Verify the fix
echo "\n5. Verifying schema...\n";
$verify_sql = "SHOW COLUMNS FROM creator_mentions WHERE Field = 'creator_id'";
$verify_result = $conn->query($verify_sql);
if ($verify_result) {
    $row = $verify_result->fetch_assoc();
    echo "   creator_id type is now: " . $row['Type'] . "\n";
}

$conn->close();

echo "\n=== Schema Fix Complete ===\n";
?>