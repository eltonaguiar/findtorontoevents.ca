<?php
/**
 * VR AI Agent — User Progress Tracking API
 *
 * Stores and retrieves per-zone visit/progress data for logged-in users.
 * PHP 5.2+ compatible.
 *
 * POST: Save progress  { user_id, progress (JSON) }
 * GET:  Load progress   { user_id }
 *
 * Database: ejaguiar1_favcreators (same as FavCreators auth)
 * Table:    vr_user_progress
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── DB Config (reuse auth_db_config pattern) ──
$envFile = dirname(__FILE__) . '/.env';
if (file_exists($envFile) && is_readable($envFile)) {
    $raw = file_get_contents($envFile);
    foreach (preg_split('/\r?\n/', $raw) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) continue;
        $eq = strpos($line, '=');
        $k = trim(substr($line, 0, $eq));
        $val = trim(substr($line, $eq + 1), " \t\"'");
        if (!array_key_exists($k, $_ENV)) $_ENV[$k] = $val;
        if (getenv($k) === false) putenv("$k=$val");
    }
}

function _vr_env($keys, $default) {
    foreach ((array)$keys as $k) {
        $v = getenv($k);
        if ($v !== false && $v !== '') return $v;
        if (isset($_ENV[$k]) && (string)$_ENV[$k] !== '') return (string)$_ENV[$k];
    }
    return $default;
}

$servername = _vr_env(array('FC_MYSQL_HOST', 'MYSQL_HOST'), 'localhost');
$username   = _vr_env(array('FC_MYSQL_USER', 'MYSQL_USER'), 'ejaguiar1_favcreators');
$password   = _vr_env(array('DB_PASS_SERVER_FAVCREATORS', 'FC_MYSQL_PASSWORD', 'MYSQL_PASSWORD'), '3ADDzY*stB6Qd#$!l1%IIKYuHVRCCupl');
$dbname     = _vr_env(array('DB_NAME_SERVER_FAVCREATORS', 'FC_MYSQL_DATABASE', 'MYSQL_DATABASE'), 'ejaguiar1_favcreators');

// ── Connect ──
$conn = @new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(array('error' => 'Database connection failed', 'detail' => $conn->connect_error));
    exit;
}
$conn->set_charset('utf8');

// ── Ensure table exists ──
$conn->query("
    CREATE TABLE IF NOT EXISTS vr_user_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        zone VARCHAR(50) DEFAULT NULL,
        progress_data TEXT DEFAULT NULL,
        first_visit DATETIME DEFAULT NULL,
        last_visit DATETIME DEFAULT NULL,
        visit_count INT DEFAULT 1,
        preferences TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT NULL,
        updated_at DATETIME DEFAULT NULL,
        UNIQUE KEY idx_user_zone (user_id, zone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
");

// Also ensure a summary table for the whole user
$conn->query("
    CREATE TABLE IF NOT EXISTS vr_user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        session_start DATETIME DEFAULT NULL,
        session_end DATETIME DEFAULT NULL,
        zones_visited TEXT DEFAULT NULL,
        total_duration INT DEFAULT 0,
        device_type VARCHAR(30) DEFAULT 'desktop',
        created_at DATETIME DEFAULT NULL,
        UNIQUE KEY idx_user_session (user_id, session_start)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
");

// ── Handle request ──
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Save progress
    $user_id = isset($_POST['user_id']) ? trim($_POST['user_id']) : '';
    $progress = isset($_POST['progress']) ? $_POST['progress'] : '';
    $zone = isset($_POST['zone']) ? trim($_POST['zone']) : '';
    $device = isset($_POST['device']) ? trim($_POST['device']) : 'desktop';

    if ($user_id === '') {
        echo json_encode(array('error' => 'user_id is required'));
        exit;
    }

    $now = date('Y-m-d H:i:s');

    // If full progress JSON was sent, parse and save per-zone
    if ($progress !== '') {
        $decoded = json_decode($progress, true);
        if (is_array($decoded)) {
            foreach ($decoded as $z => $data) {
                $zSafe = $conn->real_escape_string($z);
                $uSafe = $conn->real_escape_string($user_id);
                $dataSafe = $conn->real_escape_string(json_encode($data));
                $vc = isset($data['visitCount']) ? intval($data['visitCount']) : 1;

                $conn->query("
                    INSERT INTO vr_user_progress (user_id, zone, progress_data, first_visit, last_visit, visit_count, created_at, updated_at)
                    VALUES ('$uSafe', '$zSafe', '$dataSafe', '$now', '$now', $vc, '$now', '$now')
                    ON DUPLICATE KEY UPDATE
                        progress_data = '$dataSafe',
                        last_visit = '$now',
                        visit_count = visit_count + 1,
                        updated_at = '$now'
                ");
            }
            echo json_encode(array('success' => true, 'zones_saved' => count($decoded)));
            $conn->close();
            exit;
        }
    }

    // Single zone update
    if ($zone !== '') {
        $zSafe = $conn->real_escape_string($zone);
        $uSafe = $conn->real_escape_string($user_id);
        $pSafe = $conn->real_escape_string($progress);

        $conn->query("
            INSERT INTO vr_user_progress (user_id, zone, progress_data, first_visit, last_visit, visit_count, created_at, updated_at)
            VALUES ('$uSafe', '$zSafe', '$pSafe', '$now', '$now', 1, '$now', '$now')
            ON DUPLICATE KEY UPDATE
                progress_data = '$pSafe',
                last_visit = '$now',
                visit_count = visit_count + 1,
                updated_at = '$now'
        ");

        echo json_encode(array('success' => true, 'zone' => $zone));
        $conn->close();
        exit;
    }

    echo json_encode(array('error' => 'Either progress JSON or zone is required'));

} elseif ($method === 'GET') {
    // Load progress
    $user_id = isset($_GET['user_id']) ? trim($_GET['user_id']) : '';
    if ($user_id === '') {
        echo json_encode(array('error' => 'user_id is required'));
        exit;
    }

    $uSafe = $conn->real_escape_string($user_id);
    $result = $conn->query("SELECT zone, progress_data, first_visit, last_visit, visit_count FROM vr_user_progress WHERE user_id = '$uSafe'");

    $progress = array();
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $progress[$row['zone']] = array(
                'data' => json_decode($row['progress_data'], true),
                'first_visit' => $row['first_visit'],
                'last_visit' => $row['last_visit'],
                'visit_count' => intval($row['visit_count'])
            );
        }
    }

    echo json_encode(array('success' => true, 'user_id' => $user_id, 'progress' => $progress));
} else {
    echo json_encode(array('error' => 'Method not allowed'));
}

$conn->close();
?>
