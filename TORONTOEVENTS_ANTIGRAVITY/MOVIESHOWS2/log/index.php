<?php
/**
 * Movie/TV Series Sync Log
 * Shows history of data pulls from TMDB API
 * Reads from sync_log table in the database
 */

$host = 'localhost';
$dbname = 'ejaguiar1_tvmoviestrailers';
$username = 'ejaguiar1_tvmoviestrailers';
$password = 'D41$4Jci6T9W2PsJdagLEr*KMo96nrCD';

$db_error = null;
$logs = array();
$stats = array();

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Get sync logs (most recent first)
    $stmt = $pdo->query("SELECT * FROM sync_log ORDER BY created_at DESC LIMIT 100");
    $logs = $stmt->fetchAll();

    // Get overall stats
    $stmt = $pdo->query("SELECT
        COUNT(*) as total,
        SUM(CASE WHEN type = 'movie' THEN 1 ELSE 0 END) as movies,
        SUM(CASE WHEN type = 'tv' THEN 1 ELSE 0 END) as tv_shows,
        MIN(release_year) as earliest_year,
        MAX(release_year) as latest_year
    FROM movies");
    $stats = $stmt->fetch();

    // Get trailer count
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM trailers WHERE is_active = 1");
    $trailer_stats = $stmt->fetch();
    $stats['active_trailers'] = $trailer_stats['count'];

    // Get movies per year
    $stmt = $pdo->query("SELECT release_year, type, COUNT(*) as count
        FROM movies
        GROUP BY release_year, type
        ORDER BY release_year DESC");
    $yearly = $stmt->fetchAll();

    // Last successful sync
    $stmt = $pdo->query("SELECT * FROM sync_log WHERE status = 'success' ORDER BY created_at DESC LIMIT 1");
    $last_success = $stmt->fetch();

} catch (PDOException $e) {
    $db_error = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Movie/TV Series - Sync Log</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0d1117;
            color: #c9d1d9;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #58a6ff;
            margin-bottom: 8px;
            font-size: 1.8em;
        }
        .subtitle {
            color: #8b949e;
            margin-bottom: 24px;
            font-size: 0.95em;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }
        .stat-card {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
        }
        .stat-card .number {
            font-size: 2em;
            font-weight: bold;
            color: #58a6ff;
        }
        .stat-card .label {
            color: #8b949e;
            font-size: 0.85em;
            margin-top: 4px;
        }
        .stat-card.success .number { color: #3fb950; }
        .stat-card.warning .number { color: #d29922; }
        .stat-card.info .number { color: #a371f7; }

        .section {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
        }
        .section h2 {
            color: #f0f6fc;
            font-size: 1.2em;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #30363d;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #21262d;
        }
        th {
            color: #8b949e;
            font-weight: 600;
            font-size: 0.85em;
            text-transform: uppercase;
        }
        td { font-size: 0.9em; }
        tr:hover { background: #1c2128; }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 600;
        }
        .badge-success { background: #238636; color: #fff; }
        .badge-failed { background: #da3633; color: #fff; }
        .badge-partial { background: #9e6a03; color: #fff; }
        .badge-movie { background: #1f6feb; color: #fff; }
        .badge-tv { background: #8957e5; color: #fff; }
        .error-box {
            background: #2d1b1b;
            border: 1px solid #da3633;
            border-radius: 8px;
            padding: 16px;
            color: #f85149;
        }
        .last-sync {
            color: #3fb950;
            font-size: 0.9em;
            margin-bottom: 24px;
        }
        .last-sync .time { font-weight: bold; }
        .footer {
            text-align: center;
            color: #484f58;
            font-size: 0.8em;
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #21262d;
        }
        a { color: #58a6ff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .refresh-btn {
            display: inline-block;
            background: #238636;
            color: #fff;
            padding: 6px 16px;
            border-radius: 6px;
            font-size: 0.85em;
            margin-left: 12px;
        }
        .refresh-btn:hover { background: #2ea043; text-decoration: none; }
        @media (max-width: 600px) {
            body { padding: 12px; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            table { font-size: 0.8em; }
            th, td { padding: 6px 8px; }
        }
    </style>
</head>
<body>
    <h1>Movie &amp; TV Series Database Log</h1>
    <p class="subtitle">
        Sync history for TMDB data pulls &bull;
        <a href="../">Back to Movies</a>
        <a href="?refresh=1" class="refresh-btn">Refresh</a>
    </p>

    <?php if ($db_error): ?>
        <div class="error-box">
            <strong>Database Error:</strong> <?php echo htmlspecialchars($db_error); ?>
        </div>
    <?php else: ?>

        <?php if ($last_success): ?>
        <p class="last-sync">
            Last successful sync: <span class="time"><?php echo htmlspecialchars($last_success['created_at']); ?></span>
            &mdash; <?php echo (int)$last_success['items_processed']; ?> items processed
        </p>
        <?php endif; ?>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="number"><?php echo number_format((int)$stats['total']); ?></div>
                <div class="label">Total Titles</div>
            </div>
            <div class="stat-card success">
                <div class="number"><?php echo number_format((int)$stats['movies']); ?></div>
                <div class="label">Movies</div>
            </div>
            <div class="stat-card info">
                <div class="number"><?php echo number_format((int)$stats['tv_shows']); ?></div>
                <div class="label">TV Shows</div>
            </div>
            <div class="stat-card warning">
                <div class="number"><?php echo number_format((int)$stats['active_trailers']); ?></div>
                <div class="label">Active Trailers</div>
            </div>
            <div class="stat-card">
                <div class="number"><?php echo htmlspecialchars($stats['earliest_year'] . '-' . $stats['latest_year']); ?></div>
                <div class="label">Year Range</div>
            </div>
            <div class="stat-card success">
                <div class="number"><?php echo count($logs); ?></div>
                <div class="label">Sync Runs</div>
            </div>
        </div>

        <!-- Sync History -->
        <div class="section">
            <h2>Sync History</h2>
            <?php if (empty($logs)): ?>
                <p style="color:#8b949e;">No sync logs yet. Run a data pull to see history here.</p>
            <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>Date/Time</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Items</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($logs as $log): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($log['created_at']); ?></td>
                        <td><?php echo htmlspecialchars($log['sync_type']); ?></td>
                        <td>
                            <?php
                            $badgeClass = 'badge-' . $log['status'];
                            echo '<span class="badge ' . $badgeClass . '">' . htmlspecialchars($log['status']) . '</span>';
                            ?>
                        </td>
                        <td><?php echo (int)$log['items_processed']; ?></td>
                        <td><?php echo $log['error_message'] ? htmlspecialchars(substr($log['error_message'], 0, 100)) : '-'; ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php endif; ?>
        </div>

        <!-- Content by Year -->
        <div class="section">
            <h2>Content by Year</h2>
            <table>
                <thead>
                    <tr>
                        <th>Year</th>
                        <th>Type</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($yearly as $row): ?>
                    <tr>
                        <td><?php echo (int)$row['release_year']; ?></td>
                        <td>
                            <span class="badge badge-<?php echo $row['type'] === 'movie' ? 'movie' : 'tv'; ?>">
                                <?php echo htmlspecialchars($row['type']); ?>
                            </span>
                        </td>
                        <td><?php echo (int)$row['count']; ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

    <?php endif; ?>

    <div class="footer">
        Data sourced from <a href="https://www.themoviedb.org/" target="_blank">TMDB</a> &bull;
        findtorontoevents.ca &bull;
        Page loaded: <?php echo date('Y-m-d H:i:s T'); ?>
    </div>
</body>
</html>
