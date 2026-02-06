<?php
/**
 * Fix user_id=2's creator list - restore all 44 creators
 */

header('Content-Type: text/plain; charset=utf-8');
echo "Starting...\n";
flush();

require_once dirname(__FILE__) . '/db_connect.php';
echo "DB connected\n";
flush();

if (!isset($conn) || !$conn) {
    die("ERROR: Database not available\n");
}

// Full list of creators for user 2 with known IDs
$creator_data = array(
    array('id' => 'tonyrobbins-1', 'name' => 'Tony Robbins', 'category' => 'motivational', 'accounts' => array(array('platform' => 'youtube', 'username' => 'tonyrobbinslive', 'url' => 'https://www.youtube.com/@tonyrobbinslive'))) ,
    array('id' => 'chantellfloress-1', 'name' => 'Chantellfloress', 'category' => 'other', 'accounts' => array(array('platform' => 'tiktok', 'username' => 'chantellfloress', 'url' => 'https://www.tiktok.com/@chantellfloress'))) ,
    array('id' => 'wtfpreston-1', 'name' => 'WTFPreston', 'category' => 'entertainment', 'accounts' => array(array('platform' => 'youtube', 'username' => 'wtfprestonlive', 'url' => 'https://www.youtube.com/@wtfprestonlive'), array('platform' => 'tiktok', 'username' => 'wtfprestonlive', 'url' => 'https://www.tiktok.com/@wtfprestonlive'))) ,
    array('id' => 'clavicular-1', 'name' => 'Clavicular', 'category' => 'other', 'accounts' => array(array('platform' => 'twitch', 'username' => 'clavicular', 'url' => 'https://www.twitch.tv/clavicular'), array('platform' => 'kick', 'username' => 'clavicular', 'url' => 'https://kick.com/clavicular'))) ,
    array('id' => 'thebenjishow-1', 'name' => 'The Benji Show', 'category' => 'other', 'accounts' => array(array('platform' => 'tiktok', 'username' => 'thebenjishow', 'url' => 'https://www.tiktok.com/@thebenjishow'))) ,
    array('id' => 'zarthestar-1', 'name' => 'Zarthestar', 'category' => 'comedy', 'accounts' => array(array('platform' => 'twitch', 'username' => 'zarthestar', 'url' => 'https://www.twitch.tv/zarthestar'), array('platform' => 'youtube', 'username' => 'zarthestarcomedy', 'url' => 'https://www.youtube.com/@zarthestarcomedy'))) ,
    array('id' => 'adinross-1', 'name' => 'Adin Ross', 'category' => 'entertainment', 'accounts' => array(array('platform' => 'kick', 'username' => 'adinross', 'url' => 'https://kick.com/adinross'))) ,
    array('id' => 'starfireara-1', 'name' => 'Starfireara', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'chavcriss-1', 'name' => 'Chavcriss', 'category' => 'other', 'accounts' => array(array('platform' => 'youtube', 'username' => 'chavcriss', 'url' => 'https://www.youtube.com/@chavcriss'), array('platform' => 'tiktok', 'username' => 'chavcriss', 'url' => 'https://www.tiktok.com/@chavcriss'))) ,
    array('id' => 'jubalfresh-1', 'name' => 'Jubal Fresh', 'category' => 'comedy', 'accounts' => array(array('platform' => 'youtube', 'username' => 'jubalfresh', 'url' => 'https://www.youtube.com/@jubalfresh'))) ,
    array('id' => 'brooke-and-jeffrey-1', 'name' => 'Brooke & Jeffrey', 'category' => 'comedy', 'accounts' => array(array('platform' => 'other', 'username' => 'brookeandjeffrey', 'url' => 'https://www.brookeandjeffrey.com'))) ,
    array('id' => 'clip2prankmain-1', 'name' => 'Clip2prankmain', 'category' => 'entertainment', 'accounts' => array(array('platform' => 'tiktok', 'username' => 'clip2prankmain', 'url' => 'https://www.tiktok.com/@clip2prankmain'))) ,
    array('id' => 'hasanabi-1', 'name' => 'Hasanabi', 'category' => 'political', 'accounts' => array(array('platform' => 'youtube', 'username' => 'hasanabi', 'url' => 'https://www.youtube.com/@hasanabi'), array('platform' => 'twitch', 'username' => 'hasanabi', 'url' => 'https://www.twitch.tv/hasanabi'))) ,
    array('id' => 'stableronaldo-1', 'name' => 'Stableronaldo', 'category' => 'entertainment', 'accounts' => array(array('platform' => 'youtube', 'username' => 'stableronaldo', 'url' => 'https://www.youtube.com/@stableronaldo'))) ,
    array('id' => 'jasontheween-1', 'name' => 'Jasontheween', 'category' => 'entertainment', 'accounts' => array(array('platform' => 'youtube', 'username' => 'jasontheween', 'url' => 'https://www.youtube.com/@jasontheween'))) ,
    array('id' => 'shabellow-1', 'name' => 'Shabellow', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'nelkboys-1', 'name' => 'Nelkboys', 'category' => 'entertainment', 'accounts' => array(array('platform' => 'youtube', 'username' => 'nelkboys', 'url' => 'https://www.youtube.com/@nelkboys'))) ,
    array('id' => 'pokimane-1', 'name' => 'Pokimane', 'category' => 'entertainment', 'accounts' => array(array('platform' => 'twitch', 'username' => 'pokimane', 'url' => 'https://www.twitch.tv/pokimane'), array('platform' => 'youtube', 'username' => 'pokimane', 'url' => 'https://www.youtube.com/@pokimane'))) ,
    array('id' => 'seherrrizvii-1', 'name' => 'Seherrrizvii', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'lofe-1', 'name' => 'Lofe', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'rajneetkk-1', 'name' => 'Rajneetkk', 'category' => 'other', 'accounts' => array(array('platform' => 'tiktok', 'username' => 'rajneetkk', 'url' => 'https://www.tiktok.com/@rajneetkk'))) ,
    array('id' => 'jerodtheguyofficial-1', 'name' => 'Jerodtheguyofficial', 'category' => 'other', 'accounts' => array(array('platform' => 'tiktok', 'username' => 'jerodtheguyofficial', 'url' => 'https://www.tiktok.com/@jerodtheguyofficial'))) ,
    array('id' => 'saruuuhhhh-1', 'name' => 'Saruuuhhhh', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'abz-1', 'name' => 'Abz', 'category' => 'other', 'accounts' => array(array('platform' => 'tiktok', 'username' => 'abz', 'url' => 'https://www.tiktok.com/@abz'))) ,
    array('id' => 'zherka-1', 'name' => 'Zherka', 'category' => 'other', 'accounts' => array(array('platform' => 'youtube', 'username' => 'zherka', 'url' => 'https://www.youtube.com/@zherka'))) ,
    array('id' => 'orientgent-1', 'name' => 'Orientgent', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'a.r.a.moore-1', 'name' => 'A.r.a.moore', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'lolalocaaaa-1', 'name' => 'Lolalocaaaa', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'khadija.mx_-1', 'name' => 'Khadija.mx_', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'dantes-1', 'name' => 'Dantes', 'category' => 'entertainment', 'accounts' => array()) ,
    array('id' => 'fredbeyer-1', 'name' => 'Fredbeyer', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'zople-1', 'name' => 'Zople', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'ninja-1', 'name' => 'Ninja', 'category' => 'gaming', 'accounts' => array(array('platform' => 'youtube', 'username' => 'ninja', 'url' => 'https://www.youtube.com/@ninja'))) ,
    array('id' => 'nazakanawaki-1', 'name' => 'Nazakanawaki', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'nevsrealm-1', 'name' => 'Nevsrealm', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'alkvlogs-1', 'name' => 'Alkvlogs', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'cuffem-1', 'name' => 'Cuffem', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'chessur-1', 'name' => 'Chessur', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'demisux-1', 'name' => 'Demisux', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'biancita-1', 'name' => 'Biancita', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'jcelynaa-1', 'name' => 'Jcelynaa', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'honeymoontarot30-1', 'name' => 'Honeymoontarot30', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'xqc-1', 'name' => 'Xqc', 'category' => 'gaming', 'accounts' => array(array('platform' => 'youtube', 'username' => 'xqc', 'url' => 'https://www.youtube.com/@xqc'))) ,
    array('id' => 'loltyler1-1', 'name' => 'Loltyler1', 'category' => 'gaming', 'accounts' => array(array('platform' => 'youtube', 'username' => 'loltyler1', 'url' => 'https://www.youtube.com/@loltyler1'))) ,
    array('id' => '333ak.s-1', 'name' => '333ak.s', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'carenview-1', 'name' => 'Carenview', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'baabytrinity-1', 'name' => 'Baabytrinity', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'gabbyvn3-1', 'name' => 'Gabbyvn3', 'category' => 'other', 'accounts' => array(array('platform' => 'tiktok', 'username' => 'gabbyvn3', 'url' => 'https://www.tiktok.com/@gabbyvn3'), array('platform' => 'kick', 'username' => 'gabbyvn3', 'url' => 'https://kick.com/gabbyvn3'))) ,
    array('id' => 'gillianunrestricted-1', 'name' => 'Gillianunrestricted', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'pripeepoopoo-1', 'name' => 'Pripeepoopoo', 'category' => 'other', 'accounts' => array()) ,
    array('id' => 'brunitarte-tiktok', 'name' => 'Brunitarte', 'category' => 'other', 'accounts' => array(array('platform' => 'tiktok', 'username' => 'brunitarte', 'url' => 'https://www.tiktok.com/@brunitarte')))
);

echo "Building creator list for user_id=2...\n";
echo "Total creators to add: " . count($creator_data) . "\n\n";

$creators = array();
$now = time();

foreach ($creator_data as $cd) {
    $creators[] = array(
        'id' => $cd['id'],
        'name' => $cd['name'],
        'bio' => '',
        'avatarUrl' => '',
        'avatar_url' => '',
        'category' => $cd['category'],
        'reason' => '',
        'tags' => array(),
        'accounts' => $cd['accounts'],
        'isFavorite' => false,
        'is_favorite' => 0,
        'isPinned' => false,
        'is_pinned' => 0,
        'note' => '',
        'addedAt' => $now,
        'lastChecked' => 0
    );
}

// Save to user_lists
$json = $conn->real_escape_string(json_encode($creators));
$query = "INSERT INTO user_lists (user_id, creators, updated_at) VALUES (2, '$json', NOW()) ON DUPLICATE KEY UPDATE creators = '$json', updated_at = NOW()";

if ($conn->query($query)) {
    echo "SUCCESS: Saved " . count($creators) . " creators to user_lists for user_id=2\n";
} else {
    echo "ERROR: " . $conn->error . "\n";
}

$conn->close();
?>
