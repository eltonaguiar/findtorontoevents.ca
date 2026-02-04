<?php
/**
 * Comprehensive population: 100 movies + 100 TV shows per year (2026-2015)
 * Prioritizes recent years first
 */
header('Content-Type: text/plain; charset=utf-8');
set_time_limit(600);

require_once 'api/db-config.php';

$pdo = getDbConnection();
if (!$pdo) {
    die("Database connection failed!\n");
}

echo "COMPREHENSIVE POPULATION\n";
echo "========================\n\n";
echo "Target: 100 movies + 100 TV shows per year (2026-2015)\n\n";

$tmdbApiKey = '15d2ea6d0dc1d476efbca3eba2b9bbfb';

function fetchUrl($url)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}

function addContent($pdo, $tmdbApiKey, $year, $type, $targetCount)
{
    $endpoint = $type === 'movie' ? 'movie' : 'tv';
    $added = 0;
    $skipped = 0;

    echo "\n{$year} - " . strtoupper($type) . "S:\n";
    echo str_repeat('-', 40) . "\n";

    for ($page = 1; $page <= 10 && $added < $targetCount; $page++) {
        $url = "https://api.themoviedb.org/3/discover/{$endpoint}?api_key={$tmdbApiKey}";
        $url .= "&primary_release_year={$year}";
        $url .= "&sort_by=popularity.desc&page={$page}";

        if ($type === 'tv') {
            $url = str_replace('primary_release_year', 'first_air_date_year', $url);
        }

        $response = fetchUrl($url);
        if (!$response)
            continue;

        $data = json_decode($response, true);
        if (!isset($data['results']))
            continue;

        foreach ($data['results'] as $item) {
            if ($added >= $targetCount)
                break;

            try {
                $tmdbId = $item['id'];

                // Check if exists
                $stmt = $pdo->prepare("SELECT id FROM movies WHERE tmdb_id = ?");
                $stmt->execute(array($tmdbId));
                if ($stmt->fetch()) {
                    $skipped++;
                    continue;
                }

                // Fetch details with videos
                $detailUrl = "https://api.themoviedb.org/3/{$endpoint}/{$tmdbId}?api_key={$tmdbApiKey}&append_to_response=videos";
                $detailResponse = fetchUrl($detailUrl);

                if (!$detailResponse)
                    continue;

                $details = json_decode($detailResponse, true);

                // Find trailer
                $trailerKey = null;
                $trailerName = null;

                if (isset($details['videos']['results'])) {
                    foreach ($details['videos']['results'] as $video) {
                        if ($video['site'] === 'YouTube' && ($video['type'] === 'Trailer' || $video['type'] === 'Teaser')) {
                            $trailerKey = $video['key'];
                            $trailerName = $video['name'];
                            break;
                        }
                    }
                }

                // Only add if has trailer
                if (!$trailerKey)
                    continue;

                // Prepare data
                $title = $type === 'movie' ? $item['title'] : $item['name'];
                $description = isset($item['overview']) ? $item['overview'] : '';
                $releaseDate = $type === 'movie' ? $item['release_date'] : $item['first_air_date'];
                $releaseYear = $releaseDate ? substr($releaseDate, 0, 4) : $year;
                $rating = isset($item['vote_average']) ? round($item['vote_average'], 1) : null;

                $genres = array();
                if (isset($details['genres'])) {
                    foreach ($details['genres'] as $genre) {
                        $genres[] = $genre['name'];
                    }
                }
                $genreStr = implode(', ', $genres);

                // Insert
                $stmt = $pdo->prepare("
                    INSERT INTO movies (title, type, genre, description, release_year, imdb_rating, tmdb_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");

                $stmt->execute(array(
                    $title,
                    $type,
                    $genreStr,
                    $description,
                    $releaseYear,
                    $rating,
                    $tmdbId
                ));

                $movieId = $pdo->lastInsertId();

                // Add trailer
                $stmt = $pdo->prepare("
                    INSERT INTO trailers (movie_id, youtube_id, title, priority, is_active)
                    VALUES (?, ?, ?, 1, TRUE)
                ");
                $stmt->execute(array($movieId, $trailerKey, $trailerName));

                // Add thumbnail
                $posterPath = $type === 'movie' ? $item['poster_path'] : $item['poster_path'];
                if ($posterPath) {
                    $thumbnailUrl = "https://image.tmdb.org/t/p/w500" . $posterPath;
                    $stmt = $pdo->prepare("
                        INSERT INTO thumbnails (movie_id, url, is_primary)
                        VALUES (?, ?, TRUE)
                    ");
                    $stmt->execute(array($movieId, $thumbnailUrl));
                }

                echo "  ✅ {$title} ({$releaseYear})\n";
                $added++;

                usleep(250000); // Rate limiting

            } catch (Exception $e) {
                echo "  ❌ Error: " . $e->getMessage() . "\n";
            }
        }
    }

    echo "Added: {$added} | Skipped: {$skipped}\n";
    return $added;
}

// Years to populate (prioritize recent)
$years = array(2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015);

$totalMovies = 0;
$totalTV = 0;

foreach ($years as $year) {
    echo "\n" . str_repeat('=', 50) . "\n";
    echo "YEAR {$year}\n";
    echo str_repeat('=', 50) . "\n";

    // Add 100 movies
    $moviesAdded = addContent($pdo, $tmdbApiKey, $year, 'movie', 100);
    $totalMovies += $moviesAdded;

    // Add 100 TV shows
    $tvAdded = addContent($pdo, $tmdbApiKey, $year, 'tv', 100);
    $totalTV += $tvAdded;
}

echo "\n" . str_repeat('=', 50) . "\n";
echo "FINAL SUMMARY\n";
echo str_repeat('=', 50) . "\n";
echo "Total Movies Added: {$totalMovies}\n";
echo "Total TV Shows Added: {$totalTV}\n";
echo "Grand Total: " . ($totalMovies + $totalTV) . "\n";

// Verify final counts
$stmt = $pdo->query("
    SELECT 
        type,
        COUNT(DISTINCT m.id) as count
    FROM movies m
    INNER JOIN trailers t ON m.id = t.movie_id
    WHERE t.is_active = TRUE
    GROUP BY type
");

echo "\nDatabase Totals:\n";
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  {$row['type']}: {$row['count']}\n";
}

echo "\n✅ DONE!\n";
?>