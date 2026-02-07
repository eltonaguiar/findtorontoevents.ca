<?php
// Fix creator_mentions table collation to match creators table
// Path: /findtorontoevents.ca/fc/api/fix_creator_mentions_collation.php

header('Content-Type: text/plain');

require_once dirname(__FILE__) . '/db_connect.php';

if (!isset($conn) || !$conn) {
    echo "ERROR: Database connection failed\n";
    exit;
}

echo "=== Fixing creator_mentions Collation ===\n\n";

// Check current collation
$check_sql = "SHOW TABLE STATUS LIKE 'creator_mentions'";
$check_result = $conn->query($check_sql);
if ($check_result && $row = $check_result->fetch_assoc()) {
    echo "Current collation: " . $row['Collation'] . "\n";
}

// Alter table collation
echo "\n1. Altering table collation...\n";
$alter_sql = "ALTER TABLE creator_mentions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci";
if ($conn->query($alter_sql)) {
    echo "   Table collation updated successfully\n";
} else {
    echo "   ERROR: " . $conn->error . "\n";
    exit;
}

// Verify the fix
echo "\n2. Verifying fix...\n";
$verify_sql = "SHOW TABLE STATUS LIKE 'creator_mentions'";
$verify_result = $conn->query($verify_sql);
if ($verify_result && $row = $verify_result->fetch_assoc()) {
    echo "New collation: " . $row['Collation'] . "\n";
}

$conn->close();
echo "\n=== Fix Complete ===\n";
?>