/**
 * UPDATE #3: Add Sample Movies Directly to Database
 * Populates with high-quality sample data
 */

const API_BASE = 'https://findtorontoevents.ca/MOVIESHOWS/api';

const sampleMovies = [
    {
        title: "Dune: Part Two",
        type: "movie",
        release_year: 2024,
        genre: "Sci-Fi, Adventure",
        description: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
        tmdb_id: 693134,
        imdb_id: "tt15239678",
        source: "manual",
        trailers: [{ youtube_id: "Way9Dexny3w", title: "Official Trailer", priority: 10, source: "youtube" }],
        thumbnails: [{ url: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", source: "tmdb", priority: 10 }]
    },
    {
        title: "Oppenheimer",
        type: "movie",
        release_year: 2023,
        genre: "Biography, Drama, History",
        description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
        tmdb_id: 872585,
        imdb_id: "tt15398776",
        source: "manual",
        trailers: [{ youtube_id: "uYPbbksJxIg", title: "Official Trailer", priority: 10, source: "youtube" }],
        thumbnails: [{ url: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", source: "tmdb", priority: 10 }]
    },
    {
        title: "The Batman",
        type: "movie",
        release_year: 2022,
        genre: "Action, Crime, Drama",
        description: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption.",
        tmdb_id: 414906,
        imdb_id: "tt1877830",
        source: "manual",
        trailers: [{ youtube_id: "mqqft2x_Aa4", title: "Official Trailer", priority: 10, source: "youtube" }],
        thumbnails: [{ url: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg", source: "tmdb", priority: 10 }]
    },
    {
        title: "Spider-Man: No Way Home",
        type: "movie",
        release_year: 2021,
        genre: "Action, Adventure, Sci-Fi",
        description: "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.",
        tmdb_id: 634649,
        imdb_id: "tt10872600",
        source: "manual",
        trailers: [{ youtube_id: "JfVOs4VSpmA", title: "Official Trailer", priority: 10, source: "youtube" }],
        thumbnails: [{ url: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", source: "tmdb", priority: 10 }]
    },
    {
        title: "Inception",
        type: "movie",
        release_year: 2010,
        genre: "Action, Sci-Fi, Thriller",
        description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        tmdb_id: 27205,
        imdb_id: "tt1375666",
        source: "manual",
        trailers: [{ youtube_id: "YoHD9XEInc0", title: "Official Trailer", priority: 10, source: "youtube" }],
        thumbnails: [{ url: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", source: "tmdb", priority: 10 }]
    }
];

async function addSampleMovies() {
    console.log('🎬 Adding Sample Movies\n');

    let added = 0;
    let failed = 0;

    for (const movie of sampleMovies) {
        process.stdout.write(`${movie.title.padEnd(40)} ... `);

        try {
            const response = await fetch(`${API_BASE}/movies.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(movie)
            });

            if (response.ok) {
                console.log('✓');
                added++;
            } else {
                console.log(`✗ ${response.status}`);
                failed++;
            }
        } catch (error) {
            console.log(`✗ ${error.message}`);
            failed++;
        }

        await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\n✅ Added ${added}/${sampleMovies.length} movies`);
    if (failed > 0) console.log(`❌ Failed: ${failed}`);
}

addSampleMovies();
