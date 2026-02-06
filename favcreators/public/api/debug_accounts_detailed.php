<?php
/**
 * Deep dive - check specific creators with account issues
 */

header('Content-Type: text/plain; charset=utf-8');
echo "=== DETAILED ACCOUNT DEBUG ===\n\n";

require_once dirname(__FILE__) . '/db_connect.php';

if (!isset($conn) || !$conn) {
    die("ERROR: Database not available\n");
}

// Get current creators
$query = $conn->query("SELECT creators FROM user_lists WHERE user_id = 2");
if (!$query || $query->num_rows === 0) {
    die("ERROR: No creators found\n");
}

$row = $query->fetch_assoc();
$creators = json_decode($row['creators'], true);

echo "Total creators: " . count($creators) . "\n\n";

echo "=== CREATORS WITH NO ACCOUNTS ===\n\n";

$problem_creators = array();

foreach ($creators as $c) {
    $accounts = isset($c['accounts']) ? $c['accounts'] : array();
    if (!is_array($accounts) || count($accounts) === 0) {
        $problem_creators[] = $c['name'];
        echo "NO ACCOUNTS: {$c['name']} (ID: {$c['id']})\n";
        echo "  accounts field: " . var_export($accounts, true) . "\n";
        echo "  isset(accounts): " . (isset($c['accounts']) ? 'YES' : 'NO') . "\n";
        echo "  is_array: " . (is_array($accounts) ? 'YES' : 'NO') . "\n";
        echo "\n";
    }
}

echo "\n=== CREATORS WITH EMPTY ACCOUNTS ARRAY ===\n\n";

foreach ($creators as $c) {
    $accounts = isset($c['accounts']) ? $c['accounts'] : null;
    if (is_array($accounts) && count($accounts) === 0) {
        echo "EMPTY ARRAY: {$c['name']} (ID: {$c['id']})\n";
    }
}

echo "\n=== SAMPLE CREATOR WITH ACCOUNTS (for comparison) ===\n\n";

foreach ($creators as $c) {
    $accounts = isset($c['accounts']) ? $c['accounts'] : array();
    if (is_array($accounts) && count($accounts) > 0) {
        echo "OK: {$c['name']} has " . count($accounts) . " accounts\n";
        echo "  First account: " . json_encode($accounts[0]) . "\n";
        break;
    }
}

echo "\n=== RAW JSON CHECK FOR Gillianunrestricted ===\n\n";

foreach ($creators as $c) {
    if ($c['name'] === 'Gillianunrestricted') {
        echo json_encode($c, JSON_PRETTY_PRINT) . "\n";
        break;
    }
}

echo "\n=== RAW JSON CHECK FOR Pripeepoopoo ===\n\n";

foreach ($creators as $c) {
    if ($c['name'] === 'Pripeepoopoo') {
        echo json_encode($c, JSON_PRETTY_PRINT) . "\n";
        break;
    }
}

echo "\n=== SUMMARY ===\n";
echo "Creators with no accounts: " . count($problem_creators) . "\n";
if (count($problem_creators) > 0) {
    echo "List: " . implode(', ', $problem_creators) . "\n";
}

$conn->close();
?>
