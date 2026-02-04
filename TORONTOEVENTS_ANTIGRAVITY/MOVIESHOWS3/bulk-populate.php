<?php
/**
 * Bulk populate database with movies and TV shows from 2015-2027
 * Uses TMDB API to fetch real data
 * PHP 5.2 compatible version
 */
header('Content-Type: text/plain; charset=utf-8');
set_time_limit(600); // 10 minutes

require_once 'api/db-config.php';

$pdo = getDbConnection();

if (!$pdo) {
    die("Database connection failed!\n");
}

echo "Bulk Populating MovieShows Database\n";
echo "======================================\n\n";

// TMDB API Key
$tmdbApiKey = '15d2ea6d0dc1d476efbca3eba2b9bbfb';

$totalAdded = 0;
$errors = 0;

// Years to populate
$years = range(2015, 2027);

foreach ($years as $year) {
    echo "Processing year: $year\n";

    // Get popular movies for this year
    for ($page = 1; $page <= 5; $page++) {
        $url = "https://api.themoviedb.org/3/discover/movie?api_key={$tmdbApiKey}&primary_release_year={$year}&sort_by=popularity.desc&page={$page}";

        $response = @file_get_contents($url);
        if (!$response) {
            echo "  Failed to fetch page $page for year $year\n";
            continue;
        }

        $data = json_decode($response, true);

        if (!isset($data['results'])) {
            continue;
        }

        foreach ($data['results'] as $movie) {
            try {
                // Check if movie already exists
                $movieTmdbId = $movie['id'];
                $stmt = $pdo->prepare("SELECT id FROM movies WHERE tmdb_id = ?");
                $stmt->execute(array($movieTmdbId));
                if ($stmt->fetch()) {
                    continue; // Skip if already exists
                }

                // Get movie details including videos
                $detailUrl = "https://api.themoviedb.org/3/movie/{$movieTmdbId}?api_key={$tmdbApiKey}&append_to_response=videos";
                $detailResponse = @file_get_contents($detailUrl);

                if (!$detailResponse) {
                    continue;
                }

                $details = json_decode($detailResponse, true);

                // Extract genres
                $genres = array();
                if (isset($details['genres'])) {
                    foreach ($details['genres'] as $genre) {
                        $genres[] = $genre['name'];
                    }
                }
                $genreStr = implode(', ', $genres);

                // Insert movie
                $stmt = $pdo->prepare("
                    INSERT INTO movies (title, type, genre, description, release_year, imdb_rating, imdb_id, tmdb_id, runtime)
                    VALUES (?, 'movie', ?, ?, ?, ?, ?, ?, ?)
                ");

                $movieTitle = isset($details['title']) ? $details['title'] : $movie['title'];
                $movieDesc = isset($details['overview']) ? $details['overview'] : '';
                $releaseYear = isset($details['release_date']) ? (int) substr($details['release_date'], 0, 4) : $year;
                $rating = isset($details['vote_average']) ? round($details['vote_average'], 1) : null;
                $imdbId = isset($details['imdb_id']) ? $details['imdb_id'] : null;
                $runtime = isset($details['runtime']) ? $details['runtime'] : null;

                $stmt->execute(array(
                    $movieTitle,
                    $genreStr,
                    $movieDesc,
                    $releaseYear,
                    $rating,
                    $imdbId,
                    $movieTmdbId,
                    $runtime
                ));

                $movieId = $pdo->lastInsertId();

                // Insert trailer if available
                if (isset($details['videos']['results'])) {
                    foreach ($details['videos']['results'] as $video) {
                        if ($video['site'] === 'YouTube' && $video['type'] === 'Trailer') {
                            $videoKey = $video['key'];
                            $videoName = $video['name'];
                            $stmt = $pdo->prepare("
                                INSERT INTO trailers (movie_id, youtube_id, title, priority, is_active)
                                VALUES (?, ?, ?, 1, TRUE)
                            ");
                            $stmt->execute(array($movieId, $videoKey, $videoName));
                            break; // Only add first trailer
                        }
                    }
                }

                // Insert thumbnail
                if (isset($movie['poster_path'])) {
                    $stmt = $pdo->prepare("
                        INSERT INTO thumbnails (movie_id, url, is_primary)
                        VALUES (?, ?, TRUE)
                    ");
                    $thumbnailUrl = "https://image.tmdb.org/t/p/w500" . $movie['poster_path'];
                    $stmt->execute(array($movieId, $thumbnailUrl));
                }

                $totalAdded++;
                echo "  Added: {$movieTitle}\n";

                // Rate limiting
                usleep(250000); // 0.25 second delay

            } catch (PDOException $e) {
                $errors++;
                echo "  Error adding movie: " . $e->getMessage() . "\n";
            }
        }
    }

    echo "  Year $year complete. Total added so far: $totalAdded\n\n";
}

echo "\nBulk population complete!\n";
echo "Total movies added: $totalAdded\n";
echo "Errors: $errors\n";

// Final verification
$stmt = $pdo->query("SELECT COUNT(*) FROM movies");
$count = $stmt->fetchColumn();
echo "\nTotal movies in database: $count\n";

echo "\nVisit: https://findtorontoevents.ca/MOVIESHOWS3/app.html\n";
?>
