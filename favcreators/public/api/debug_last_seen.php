<?php
/**
 * Debug endpoint to diagnose last_seen issues
 */
error_reporting(E_ALL);
ini_set('display_errors', '1');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$debug = array();
$debug['php_version'] = phpversion();
$debug['step'] = 'starting';

try {
    // Step 1: Check if db_connect loads
    $debug['step'] = 'loading db_connect';
    require_once 'db_connect.php';
    $debug['db_connect'] = 'loaded';
    
    // Step 2: Check connection
    $debug['step'] = 'checking connection';
    if (!isset($conn) || !$conn) {
        throw new Exception('Database connection not available');
    }
    $debug['connection'] = 'available';
    
    // Step 3: Check if table exists
    $debug['step'] = 'checking table';
    $table_check = $conn->query("SHOW TABLES LIKE 'streamer_last_seen'");
    if ($table_check === false) {
        throw new Exception('Query failed: ' . $conn->error);
    }
    $table_exists = $table_check->num_rows > 0;
    $debug['table_exists'] = $table_exists;
    
    // Step 4: Try to create table if not exists
    if (!$table_exists) {
        $debug['step'] = 'creating table';
        $sql = "CREATE TABLE IF NOT EXISTS streamer_last_seen (
            id INT AUTO_INCREMENT PRIMARY KEY,
            creator_id VARCHAR(64) NOT NULL,
            creator_name VARCHAR(255) NOT NULL,
            platform VARCHAR(32) NOT NULL,
            username VARCHAR(255) NOT NULL,
            account_url VARCHAR(1024) DEFAULT '',
            is_live TINYINT(1) DEFAULT 0,
            last_seen_online DATETIME,
            last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
            stream_title VARCHAR(512) DEFAULT '',
            viewer_count INT DEFAULT 0,
            check_count INT DEFAULT 1,
            first_seen_by VARCHAR(255) DEFAULT '',
            UNIQUE KEY uq_creator_platform (creator_id, platform),
            INDEX idx_is_live (is_live),
            INDEX idx_last_seen_online (last_seen_online),
            INDEX idx_last_checked (last_checked)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $result = $conn->query($sql);
        if (!$result) {
            throw new Exception('Failed to create table: ' . $conn->error);
        }
        $debug['table_created'] = true;
    }
    
    // Step 5: Try a simple query
    $debug['step'] = 'testing query';
    $test_query = $conn->query("SELECT COUNT(*) as count FROM streamer_last_seen");
    if ($test_query) {
        $row = $test_query->fetch_assoc();
        $debug['record_count'] = intval($row['count']);
    } else {
        $debug['query_error'] = $conn->error;
    }
    
    $debug['success'] = true;
    
} catch (Exception $e) {
    $debug['error'] = $e->getMessage();
    $debug['success'] = false;
}

echo json_encode($debug);

if (isset($conn)) {
    $conn->close();
}
?>
