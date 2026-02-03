/**
 * Add specific movies to the database
 * Movies: The Housemaid, Zootopia, The Wrecking Crew, The Plague, Iron Lung, 
 *         Fallout, Wonderman, Anaconda, Greenland 2, The Rip, Shelter, Shrinking, Beauty
 */

const axios = require('axios');
require('dotenv').config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_URL = 'https://findtorontoevents.ca/MOVIESHOWS/api';

/**
 * Search TMDB for movie/TV show
 */
async function searchTMDB(title, type = 'movie') {
  try {
    const endpoint = type === 'tv_series' ? 'search/tv' : 'search/movie';
    const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}`, {
      params: {
        api_key: TMDB_API_KEY,
        query: title,
        language: 'en-US'
      }
    });

    return response.data.results[0] || null;
  } catch (error) {
    console.error(`TMDB search error for "${title}":`, error.message);
    return null;
  }
}

/**
 * Get detailed movie/TV info from TMDB
 */
async function getTMDBDetails(tmdbId, type = 'movie') {
  try {
    const endpoint = type === 'tv_series' ? `tv/${tmdbId}` : `movie/${tmdbId}`;
    const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        append_to_response: 'videos,images'
      }
    });

    return response.data;
  } catch (error) {
    console.error(`TMDB details error:`, error.message);
    return null;
  }
}

const specificMovies = [
  {
    title: "The Housemaid",
    type: "movie",
    release_year: 2025,
    genre: "Thriller, Drama",
    description: "A psychological thriller about a housemaid with dark secrets",
    source: "manual_request"
  },
  {
    title: "Zootopia",
    type: "movie",
    release_year: 2016,
    genre: "Animation, Adventure, Comedy",
    description: "In a city of anthropomorphic animals, a rookie bunny cop and a cynical con artist fox must work together",
    source: "manual_request"
  },
  {
    title: "The Wrecking Crew",
    type: "movie",
    release_year: 2025,
    genre: "Action, Thriller",
    description: "An action-packed thriller about a demolition crew",
    source: "manual_request"
  },
  {
    title: "The Plague",
    type: "movie",
    release_year: 2025,
    genre: "Horror, Thriller",
    description: "A terrifying plague spreads through a small town",
    source: "manual_request"
  },
  {
    title: "Iron Lung",
    type: "movie",
    release_year: 2024,
    genre: "Horror, Sci-Fi",
    description: "Based on the horror game, a convict is sent to explore an ocean of blood",
    source: "manual_request"
  },
  {
    title: "Fallout",
    type: "tv_series",
    release_year: 2024,
    genre: "Sci-Fi, Action, Drama",
    description: "Based on the video game series, survivors emerge from underground vaults into a post-apocalyptic world",
    source: "manual_request"
  },
  {
    title: "Wonder Man",
    type: "tv_series",
    release_year: 2025,
    genre: "Action, Comedy, Superhero",
    description: "Marvel series about Simon Williams, a superhero with ionic energy powers",
    source: "manual_request"
  },
  {
    title: "Anaconda",
    type: "movie",
    release_year: 2025,
    genre: "Horror, Thriller",
    description: "A deadly giant anaconda terrorizes a group of explorers",
    source: "manual_request"
  },
  {
    title: "Greenland 2",
    type: "movie",
    release_year: 2025,
    genre: "Action, Thriller, Disaster",
    description: "Sequel to Greenland, continuing the survival story after a comet impact",
    source: "manual_request"
  },
  {
    title: "The Rip",
    type: "movie",
    release_year: 2025,
    genre: "Thriller, Mystery",
    description: "A mysterious thriller about a dangerous rip in reality",
    source: "manual_request"
  },
  {
    title: "Shelter",
    type: "movie",
    release_year: 2025,
    genre: "Drama, Thriller",
    description: "A gripping story about finding shelter in desperate times",
    source: "manual_request"
  },
  {
    title: "Shrinking",
    type: "tv_series",
    release_year: 2023,
    genre: "Comedy, Drama",
    description: "A grieving therapist starts to break the rules by telling his clients exactly what he thinks",
    source: "manual_request"
  },
  {
    title: "Beauty",
    type: "movie",
    release_year: 2025,
    genre: "Drama, Romance",
    description: "A powerful story exploring the concept of beauty and identity",
    source: "manual_request"
  }
];


async function addSpecificMovies() {
  console.log('Adding specific movies to database with TMDB metadata...\n');

  for (const movie of specificMovies) {
    try {
      console.log(`\nProcessing: ${movie.title}`);

      // Search TMDB for the movie
      const tmdbResult = await searchTMDB(movie.title, movie.type);

      let movieData = { ...movie };
      let thumbnails = [];
      let trailers = [];

      if (tmdbResult) {
        console.log(`  ✓ Found on TMDB (ID: ${tmdbResult.id})`);

        // Get detailed info
        const details = await getTMDBDetails(tmdbResult.id, movie.type);

        if (details) {
          // Update movie data with TMDB info
          movieData = {
            title: movie.title,
            type: movie.type,
            release_year: details.release_date ? new Date(details.release_date).getFullYear() :
              details.first_air_date ? new Date(details.first_air_date).getFullYear() :
                movie.release_year,
            genre: details.genres ? details.genres.map(g => g.name).join(', ') : movie.genre,
            description: details.overview || movie.description,
            tmdb_id: details.id,
            imdb_id: details.imdb_id || null,
            source: 'tmdb'
          };

          // Add poster as thumbnail
          if (details.poster_path) {
            thumbnails.push({
              url: `https://image.tmdb.org/t/p/w500${details.poster_path}`,
              source: 'tmdb',
              priority: 10,
              width: 500,
              height: 750
            });
          }

          // Add backdrop as alternative thumbnail
          if (details.backdrop_path) {
            thumbnails.push({
              url: `https://image.tmdb.org/t/p/w780${details.backdrop_path}`,
              source: 'tmdb',
              priority: 5,
              width: 780,
              height: 439
            });
          }

          // Extract YouTube trailers from TMDB
          if (details.videos && details.videos.results) {
            const youtubeTrailers = details.videos.results
              .filter(v => v.site === 'YouTube' && v.type === 'Trailer')
              .slice(0, 3); // Top 3 trailers

            youtubeTrailers.forEach((trailer, index) => {
              trailers.push({
                youtube_id: trailer.key,
                title: trailer.name,
                priority: 10 - index,
                source: 'tmdb',
                view_count: 0
              });
            });
          }
        }
      } else {
        console.log(`  ⊘ Not found on TMDB, using manual data`);
      }

      // Add movie to database
      const response = await axios.post(`${API_URL}/movies.php`, {
        ...movieData,
        thumbnails,
        trailers
      });

      if (response.data.id) {
        console.log(`  ✓ Added to database (ID: ${response.data.id})`);
        console.log(`    - Thumbnails: ${thumbnails.length}`);
        console.log(`    - Trailers: ${trailers.length}`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      if (error.response && error.response.data) {
        console.error(`  ✗ Failed: ${error.response.data.error}`);
      } else {
        console.error(`  ✗ Error:`, error.message);
      }
    }
  }

  console.log('\n✓ Done adding specific movies!');
}



// Run if executed directly
if (require.main === module) {
  if (!TMDB_API_KEY) {
    console.error('⚠ TMDB_API_KEY not set in .env file');
    console.log('Movies will be added without TMDB metadata\n');
  }

  addSpecificMovies()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { addSpecificMovies, specificMovies, searchTMDB, getTMDBDetails };

