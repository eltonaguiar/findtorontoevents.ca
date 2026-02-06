<?php
/**
 * Fix creators with empty accounts arrays
 */

header('Content-Type: text/plain; charset=utf-8');
echo "=== FIXING EMPTY ACCOUNTS ===\n\n";

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

echo "Loaded " . count($creators) . " creators\n\n";

// Social media mappings - SAME usernames as before
$social_mappings = array(
    'Shabellow' => array(
        array('platform' => 'tiktok', 'username' => 'shabellow'),
        array('platform' => 'youtube', 'username' => 'shabellow'),
        array('platform' => 'instagram', 'username' => 'shabellow'),
    ),
    'Seherrrizvii' => array(
        array('platform' => 'tiktok', 'username' => 'seherrrizvii'),
        array('platform' => 'instagram', 'username' => 'seherrrizvii'),
    ),
    'Lofe' => array(
        array('platform' => 'youtube', 'username' => 'lofe'),
        array('platform' => 'tiktok', 'username' => 'lofe'),
        array('platform' => 'instagram', 'username' => 'lofe'),
    ),
    'Saruuuhhhh' => array(
        array('platform' => 'tiktok', 'username' => 'saruuuhhhh'),
        array('platform' => 'instagram', 'username' => 'saruuuhhhh'),
    ),
    'Orientgent' => array(
        array('platform' => 'tiktok', 'username' => 'orientgent'),
        array('platform' => 'instagram', 'username' => 'orientgent'),
    ),
    'A.r.a.moore' => array(
        array('platform' => 'tiktok', 'username' => 'a.r.a.moore'),
        array('platform' => 'instagram', 'username' => 'a.r.a.moore'),
    ),
    'Lolalocaaaa' => array(
        array('platform' => 'tiktok', 'username' => 'lolalocaaaa'),
        array('platform' => 'instagram', 'username' => 'lolalocaaaa'),
    ),
    'Khadija.mx_' => array(
        array('platform' => 'tiktok', 'username' => 'khadija.mx_'),
        array('platform' => 'instagram', 'username' => 'khadija.mx_'),
    ),
    'Dantes' => array(
        array('platform' => 'youtube', 'username' => 'dantes'),
        array('platform' => 'twitch', 'username' => 'dantes'),
        array('platform' => 'tiktok', 'username' => 'dantes'),
    ),
    'Fredbeyer' => array(
        array('platform' => 'tiktok', 'username' => 'fredbeyer'),
        array('platform' => 'instagram', 'username' => 'fredbeyer'),
    ),
    'Zople' => array(
        array('platform' => 'tiktok', 'username' => 'zople'),
        array('platform' => 'instagram', 'username' => 'zople'),
    ),
    'Nazakanawaki' => array(
        array('platform' => 'tiktok', 'username' => 'nazakanawaki'),
        array('platform' => 'instagram', 'username' => 'nazakanawaki'),
    ),
    'Nevsrealm' => array(
        array('platform' => 'tiktok', 'username' => 'nevsrealm'),
        array('platform' => 'instagram', 'username' => 'nevsrealm'),
    ),
    'Alkvlogs' => array(
        array('platform' => 'tiktok', 'username' => 'alkvlogs'),
        array('platform' => 'youtube', 'username' => 'alkvlogs'),
        array('platform' => 'instagram', 'username' => 'alkvlogs'),
    ),
    'Cuffem' => array(
        array('platform' => 'youtube', 'username' => 'cuffem'),
        array('platform' => 'tiktok', 'username' => 'cuffem'),
        array('platform' => 'instagram', 'username' => 'cuffem'),
    ),
    'Chessur' => array(
        array('platform' => 'youtube', 'username' => 'chessur'),
        array('platform' => 'twitch', 'username' => 'chessur'),
        array('platform' => 'tiktok', 'username' => 'chessur'),
    ),
    'Demisux' => array(
        array('platform' => 'twitch', 'username' => 'demisux'),
        array('platform' => 'youtube', 'username' => 'demisux'),
        array('platform' => 'instagram', 'username' => 'demisux'),
    ),
    'Biancita' => array(
        array('platform' => 'tiktok', 'username' => 'biancita'),
        array('platform' => 'instagram', 'username' => 'biancita'),
    ),
    'Jcelynaa' => array(
        array('platform' => 'tiktok', 'username' => 'jcelynaa'),
        array('platform' => 'instagram', 'username' => 'jcelynaa'),
    ),
    'Honeymoontarot30' => array(
        array('platform' => 'tiktok', 'username' => 'honeymoontarot30'),
        array('platform' => 'instagram', 'username' => 'honeymoontarot30'),
    ),
    '333ak.s' => array(
        array('platform' => 'tiktok', 'username' => '333ak.s'),
        array('platform' => 'instagram', 'username' => '333ak.s'),
    ),
    'Carenview' => array(
        array('platform' => 'tiktok', 'username' => 'carenview'),
        array('platform' => 'instagram', 'username' => 'carenview'),
    ),
    'Baabytrinity' => array(
        array('platform' => 'tiktok', 'username' => 'baabytrinity'),
        array('platform' => 'instagram', 'username' => 'baabytrinity'),
    ),
    'Gillianunrestricted' => array(
        array('platform' => 'tiktok', 'username' => 'gillianunrestricted'),
        array('platform' => 'instagram', 'username' => 'gillianunrestricted'),
    ),
    'Pripeepoopoo' => array(
        array('platform' => 'tiktok', 'username' => 'pripeepoopoo'),
        array('platform' => 'instagram', 'username' => 'pripeepoopoo'),
    ),
);

$now = time();
$fixed_count = 0;
$new_creators = array();

foreach ($creators as $creator) {
    $name = $creator['name'];
    $accounts = isset($creator['accounts']) ? $creator['accounts'] : array();
    
    // Check if accounts is empty and we have mappings for this creator
    if (empty($accounts) && isset($social_mappings[$name])) {
        $accounts_to_add = $social_mappings[$name];
        $new_accounts = array();
        
        foreach ($accounts_to_add as $account) {
            $platform = $account['platform'];
            $username = $account['username'];
            
            // Build URL
            switch ($platform) {
                case 'youtube':
                    $url = "https://www.youtube.com/@{$username}";
                    break;
                case 'twitch':
                    $url = "https://www.twitch.tv/{$username}";
                    break;
                case 'tiktok':
                    $url = "https://www.tiktok.com/@{$username}";
                    break;
                case 'kick':
                    $url = "https://kick.com/{$username}";
                    break;
                case 'instagram':
                    $url = "https://www.instagram.com/{$username}/";
                    break;
                default:
                    $url = '';
            }
            
            $new_accounts[] = array(
                'id' => $platform . '_' . $username . '_' . $now,
                'platform' => $platform,
                'username' => $username,
                'url' => $url
            );
        }
        
        $creator['accounts'] = $new_accounts;
        echo "✓ FIXED: {$name} - added " . count($new_accounts) . " accounts\n";
        $fixed_count++;
    } else {
        echo "  OK: {$name} - has " . count($accounts) . " accounts\n";
    }
    
    $new_creators[] = $creator;
}

echo "\n=================================\n";
echo "Fixed {$fixed_count} creators\n";

// Save to database
$json = $conn->real_escape_string(json_encode($new_creators));
$query = "UPDATE user_lists SET creators = '{$json}', updated_at = NOW() WHERE user_id = 2";

if ($conn->query($query)) {
    echo "✓ SUCCESS: Saved to database\n";
} else {
    echo "✗ ERROR: " . $conn->error . "\n";
}

// Verify
$result = $conn->query("SELECT creators FROM user_lists WHERE user_id = 2");
$row = $result->fetch_assoc();
$verify = json_decode($row['creators'], true);
$total_accounts = 0;
foreach ($verify as $c) {
    $total_accounts += count($c['accounts']);
}
echo "Verification: Total " . count($verify) . " creators with {$total_accounts} total accounts\n";

$conn->close();
?>
