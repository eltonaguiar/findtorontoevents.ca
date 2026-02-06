<?php
/**
 * Deep dive diagnosis of creator accounts issue
 */

header('Content-Type: text/plain; charset=utf-8');
echo "=== DEEP DIVE: Creator Accounts Diagnosis ===\n\n";

require_once dirname(__FILE__) . '/db_connect.php';

if (!isset($conn) || !$conn) {
    die("ERROR: Database not available\n");
}

// Get current creators from user_lists
$query = $conn->query("SELECT creators FROM user_lists WHERE user_id = 2");
if (!$query || $query->num_rows === 0) {
    die("ERROR: No creators found for user_id=2\n");
}

$row = $query->fetch_assoc();
$creators_json = $row['creators'];
$creators = json_decode($creators_json, true);

if (!is_array($creators)) {
    die("ERROR: Failed to decode creators JSON. Error: " . json_last_error_msg() . "\n");
}

echo "Total creators: " . count($creators) . "\n\n";

echo "=== CREATORS WITH ACCOUNT ISSUES ===\n\n";

foreach ($creators as $i => $creator) {
    $name = $creator['name'];
    $id = $creator['id'];
    
    // Check accounts field
    $has_accounts_key = isset($creator['accounts']);
    $accounts = $has_accounts_key ? $creator['accounts'] : null;
    $accounts_count = is_array($accounts) ? count($accounts) : 0;
    
    if ($accounts_count === 0) {
        echo "PROBLEM: #{$i} {$name} ({$id})\n";
        echo "  - Has 'accounts' key: " . ($has_accounts_key ? 'YES' : 'NO') . "\n";
        echo "  - accounts is array: " . (is_array($accounts) ? 'YES' : 'NO') . "\n";
        echo "  - accounts value: " . var_export($accounts, true) . "\n";
        echo "\n";
    }
}

echo "\n=== ALL CREATORS SUMMARY ===\n\n";

$with_accounts = 0;
$without_accounts = 0;

foreach ($creators as $creator) {
    $name = $creator['name'];
    $accounts = isset($creator['accounts']) && is_array($creator['accounts']) ? $creator['accounts'] : array();
    $count = count($accounts);
    
    if ($count > 0) {
        $with_accounts++;
    } else {
        $without_accounts++;
        echo "NO ACCOUNTS: {$name}\n";
    }
}

echo "\n=================================\n";
echo "With accounts: {$with_accounts}\n";
echo "Without accounts: {$without_accounts}\n";

// Check JSON structure
echo "\n=== JSON STRUCTURE CHECK ===\n";
$test_creator = $creators[0];
echo "Sample creator keys: " . implode(', ', array_keys($test_creator)) . "\n";

// Check if accounts is properly structured
if (isset($test_creator['accounts']) && is_array($test_creator['accounts']) && count($test_creator['accounts']) > 0) {
    $first_account = $test_creator['accounts'][0];
    echo "Sample account keys: " . implode(', ', array_keys($first_account)) . "\n";
}

// Check raw JSON for Lofe specifically
echo "\n=== RAW JSON FOR 'Lofe' ===\n";
foreach ($creators as $creator) {
    if ($creator['name'] === 'Lofe') {
        echo json_encode($creator, JSON_PRETTY_PRINT) . "\n";
        break;
    }
}

$conn->close();
?>
