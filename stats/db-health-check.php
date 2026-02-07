<?php
// DB connectivity check
error_reporting(0);
ini_set('display_errors','0');
header("Content-Type: application/json");
header("X-Robots-Tag: noindex");

$dbs = array(
    array('ejaguiar1_events', 'localhost', 'ejaguiar1_events', '0nOj4g4RA%FD9P4c7iq)'),
    array('ejaguiar1_favcreators', 'localhost', 'ejaguiar1_favcreators', '3ADDzY*stB6Qd#$!l1%IIKYuHVRCCupl'),
    array('ejaguiar1_tvmoviestrailers', 'localhost', 'ejaguiar1_tvmoviestrailers', 'D41$4Jci6T9W2PsJdagLEr*KMo96nrCD'),
);

// 4. tvmoviestrailers via movieshows2 (parse password from file)
echo "\n4. ejaguiar1_tvmoviestrailers (movieshows2/api/db-config.php):\n";
$ms2 = dirname(__FILE__) . '/../movieshows2/api/db-config.php';
if (file_exists($ms2)) {
    $src = file_get_contents($ms2);
    if (preg_match("/password\s*=\s*'([^']+)'/", $src, $m)) {
        $c = @new mysqli('localhost', 'ejaguiar1_tvmoviestrailers', $m[1], 'ejaguiar1_tvmoviestrailers');
        if ($c->connect_error) {
            echo "  FAIL: " . $c->connect_error . "\n";
        } else {
            $r = $c->query("SHOW TABLES");
            echo "  OK: " . $r->num_rows . " tables\n";
            $c->close();
        }
    } else {
        echo "  SKIP: could not parse password\n";
    }
} else {
    echo "  SKIP: not found\n";
}

echo "\nALL_DONE\n";
?>
