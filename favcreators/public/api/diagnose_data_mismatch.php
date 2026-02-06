<?php
/**
 * Diagnose data mismatch between creator_mentions and creators tables
 * This script checks if content in creator_mentions is correctly linked to creators
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once dirname(__FILE__) . '/db_connect.php';

header('Content-Type: text/plain');

echo "=== Data Mismatch Diagnosis ===\n\n";

// Check for ID truncation issues
echo "1. Checking for ID truncation in creator_mentions:\n";
$sql = "SELECT DISTINCT cm.creator_id, c.id as correct_id, c.name 
        FROM creator_mentions cm 
        LEFT JOIN creators c ON cm.creator_id = c.id 
        WHERE c.id IS NOT NULL 
        AND cm.creator_id != c.id";
$result = $conn->query($sql);
if ($result && $result->num_rows > 0) {
    echo "   Found mismatched IDs:\n";
    while ($row = $result->fetch_assoc()) {
        echo "   - creator_mentions ID: '{$row['creator_id']}' -> correct ID: '{$row['correct_id']}' ({$row['name']})\n";
    }
} else {
    echo "   No mismatches found via JOIN (this might mean IDs are completely wrong)\n";
}

// Check creator_mentions with integer-looking IDs that might be truncated UUIDs
echo "\n2. Checking for potentially truncated UUIDs:\n";
$sql = "SELECT DISTINCT creator_id FROM creator_mentions 
        WHERE creator_id REGEXP '^[0-9]+$' 
        AND LENGTH(creator_id) < 10";
$result = $conn->query($sql);
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $short_id = $row['creator_id'];
        // Try to find matching creator by prefix
        $find_sql = "SELECT id, name FROM creators WHERE id LIKE '$short_id%'";
        $find_result = $conn->query($find_sql);
        if ($find_result && $find_result->num_rows > 0) {
            $creator = $find_result->fetch_assoc();
            if ($creator['id'] != $short_id) {
                echo "   - ID '$short_id' appears to be truncated UUID for: {$creator['name']} (full ID: {$creator['id']})\n";
            }
        }
    }
}

// Check Honeymoontarot30 specifically
echo "\n3. Checking Honeymoontarot30:\n";
$sql = "SELECT id, name FROM creators WHERE name LIKE '%honeymoon%'";
$result = $conn->query($sql);
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "   creators table: ID='{$row['id']}', Name='{$row['name']}'\n";
        
        // Check what content exists for this creator
        $cm_sql = "SELECT COUNT(*) as count FROM creator_mentions WHERE creator_id = '{$row['id']}'";
        $cm_result = $conn->query($cm_sql);
        $cm_count = $cm_result ? $cm_result->fetch_assoc()['count'] : 0;
        echo "   Content with correct ID: $cm_count items\n";
        
        // Check if there's content with wrong ID
        $cm_sql2 = "SELECT COUNT(*) as count FROM creator_mentions WHERE creator_id = '23013193'";
        $cm_result2 = $conn->query($cm_sql2);
        $cm_count2 = $cm_result2 ? $cm_result2->fetch_assoc()['count'] : 0;
        if ($cm_count2 > 0) {
            echo "   Content with wrong ID '23013193': $cm_count2 items (THIS IS THE PROBLEM!)\n";
        }
    }
}

// Check for AdinRoss content under Honeymoontarot30
echo "\n4. Checking if AdinRoss content is under wrong creator:\n";
$sql = "SELECT cm.id, cm.creator_id, cm.title, cm.platform 
        FROM creator_mentions cm 
        WHERE cm.creator_id = '23013193' 
        AND (cm.title LIKE '%adin%' OR cm.title LIKE '%ross%')
        LIMIT 5";
$result = $conn->query($sql);
if ($result && $result->num_rows > 0) {
    echo "   FOUND AdinRoss content under creator_id '23013193':\n";
    while ($row = $result->fetch_assoc()) {
        echo "   - ID {$row['id']}: {$row['title']}\n";
    }
} else {
    echo "   No AdinRoss content found under wrong ID\n";
}

// Get all content for Honeymoontarot30
echo "\n5. All content currently linked to '23013193':\n";
$sql = "SELECT cm.id, cm.title, cm.platform, cm.content_url 
        FROM creator_mentions cm 
        WHERE cm.creator_id = '23013193'
        ORDER BY cm.posted_at DESC
        LIMIT 10";
$result = $conn->query($sql);
if ($result) {
    while ($row = $result->fetch_assoc()) {
        echo "   - {$row['platform']}: {$row['title']}\n";
    }
}

$conn->close();

echo "\n=== Diagnosis Complete ===\n";
?>