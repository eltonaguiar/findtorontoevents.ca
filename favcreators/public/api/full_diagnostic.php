<?php
/**
 * Full diagnostic of all issues
 */

header('Content-Type: text/plain; charset=utf-8');
echo "=== FULL DIAGNOSTIC ===\n\n";

require_once dirname(__FILE__) . '/db_connect.php';

if (!isset($conn) || !$conn) {
    die("ERROR: Database not available\n");
}

$query = $conn->query("SELECT creators FROM user_lists WHERE user_id = 2");
if (!$query || $query->num_rows === 0) {
    die("ERROR: No creators found\n");
}

$row = $query->fetch_assoc();
$creators = json_decode($row['creators'], true);

echo "Total creators: " . count($creators) . "\n\n";

// Check for Atsyn/Autsyn
foreach ($creators as $c) {
    $name_lower = strtolower($c['name']);
    if (strpos($name_lower, 'atsyn') !== false) {
        echo "FOUND ATSYN VARIANT: {$c['name']} (ID: {$c['id']})\n";
        echo "  Accounts: " . count($c['accounts']) . "\n\n";
    }
}

// Check creators with empty/no accounts
echo "=== CREATORS WITH EMPTY ACCOUNTS ===\n\n";
$empty_accounts = array();
foreach ($creators as $c) {
    $accounts = isset($c['accounts']) ? $c['accounts'] : array();
    if (!is_array($accounts) || count($accounts) === 0) {
        $empty_accounts[] = $c['name'];
        echo "EMPTY: {$c['name']} (ID: {$c['id']})\n";
    }
}

echo "\nTotal with empty accounts: " . count($empty_accounts) . "\n";

// Show sample of a creator WITH accounts
echo "\n=== SAMPLE WITH ACCOUNTS ===\n";
foreach ($creators as $c) {
    if (isset($c['accounts']) && count($c['accounts']) > 0) {
        echo "OK: {$c['name']} has " . count($c['accounts']) . " accounts\n";
        echo "  Sample: " . json_encode($c['accounts'][0]) . "\n";
        break;
    }
}

$conn->close();
?>
