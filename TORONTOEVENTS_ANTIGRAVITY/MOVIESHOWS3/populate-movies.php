<?php
/**
 * Populate database with sample movies
 */
header('Content-Type: text/plain; charset=utf-8');

require_once 'api/db-config.php';

$pdo = getDbConnection();

if (!$pdo) {
    die("❌ Database connection failed!\n");
}

echo "🎬 Populating MovieShows Database\n";
echo "==================================\n\n";

// Sample movies data
$movies = [
    [
        'title' => 'Avatar: Fire and Ash',
        'type' => 'movie',
        'genre' => 'Sci-Fi, Adventure, Action',
        'description' => "James Cameron's next chapter in the Avatar saga. The Na'vi face new threats as the RDA returns with devastating force.",
        'release_year' => 2026,
        'imdb_rating' => 8.5,
        'trailer_id' => 'Ma1x7ikpid8',
        'thumbnail' => 'https://image.tmdb.org/t/p/w500/rmrfRWP2L3jGQOGLgXbP2q5nN2x.jpg'
    ],
    [
        'title' => 'The Batman Part II',
        'type' => 'movie',
        'genre' => 'Action, Crime, Drama',
        'description' => "The sequel to Matt Reeves' The Batman, continuing the crime saga in Gotham City.",
        'release_year' => 2026,
        'imdb_rating' => 8.8,
        'trailer_id' => 'dQw4w9WgXcQ',
        'thumbnail' => 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50x9TfdLnTp.jpg'
    ],
    [
        'title' => 'Shrek 5',
        'type' => 'movie',
        'genre' => 'Animation, Adventure, Comedy',
        'description' => 'The beloved green ogre returns with Donkey and Fiona in a highly anticipated new chapter.',
        'release_year' => 2026,
        'imdb_rating' => null,
        'trailer_id' => 'dQw4w9WgXcQ',
        'thumbnail' => 'https://image.tmdb.org/t/p/w500/shrk5shrk5shrk5shrk5.jpg'
    ],
    [
        'title' => 'Avengers: Doomsday',
        'type' => 'movie',
        'genre' => 'Action, Sci-Fi, Adventure',
        'description' => 'The Avengers must assemble once again to face a threat that endangers the entire multiverse.',
        'release_year' => 2026,
        'imdb_rating' => 9.2,
        'trailer_id' => 'dQw4w9WgXcQ',
        'thumbnail' => 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg'
    ],
    [
        'title' => 'Scream 7',
        'type' => 'movie',
        'genre' => 'Horror, Thriller',
        'description' => 'Neve Campbell and Courteney Cox return in the next chapter of the iconic horror franchise.',
        'release_year' => 2026,
        'imdb_rating' => 7.5,
        'trailer_id' => 'dQw4w9WgXcQ',
        'thumbnail' => 'https://image.tmdb.org/t/p/w500/8WUV2HFQlN5cEs6Ebkksj6F4bT.jpg'
    ]
];

try {
    $pdo->beginTransaction();

    foreach ($movies as $movie) {
        // Insert movie
        $stmt = $pdo->prepare("
            INSERT INTO movies (title, type, genre, description, release_year, imdb_rating)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $movie['title'],
            $movie['type'],
            $movie['genre'],
            $movie['description'],
            $movie['release_year'],
            $movie['imdb_rating']
        ]);

        $movieId = $pdo->lastInsertId();

        // Insert trailer
        $stmt = $pdo->prepare("
            INSERT INTO trailers (movie_id, youtube_id, title, priority, is_active)
            VALUES (?, ?, ?, 1, TRUE)
        ");

        $stmt->execute([$movieId, $movie['trailer_id'], $movie['title'] . ' - Official Trailer']);

        // Insert thumbnail
        $stmt = $pdo->prepare("
            INSERT INTO thumbnails (movie_id, url, is_primary)
            VALUES (?, ?, TRUE)
        ");

        $stmt->execute([$movieId, $movie['thumbnail']]);

        echo "✅ Added: {$movie['title']}\n";
    }

    $pdo->commit();

    echo "\n✅ Successfully added " . count($movies) . " movies!\n\n";

    // Verify
    $stmt = $pdo->query("SELECT COUNT(*) FROM movies");
    $count = $stmt->fetchColumn();
    echo "📊 Total movies in database: $count\n";

    echo "\n🎉 Database population complete!\n";
    echo "🌐 Visit: https://findtorontoevents.ca/MOVIESHOWS3/app.html\n";

} catch (PDOException $e) {
    $pdo->rollBack();
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>