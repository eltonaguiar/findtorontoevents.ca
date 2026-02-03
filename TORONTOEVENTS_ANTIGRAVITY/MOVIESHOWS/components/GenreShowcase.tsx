/**
 * UPDATE #68: Genre Showcase Component
 * Display movies grouped by genre
 */

import React from 'react';
import { TrendingSection } from './TrendingSection';

interface Movie {
    id: number;
    title: string;
    genre?: string;
    [key: string]: any;
}

interface GenreShowcaseProps {
    movies: Movie[];
    genres?: string[];
}

export function GenreShowcase({ movies, genres }: GenreShowcaseProps) {
    // Group movies by genre
    const moviesByGenre = React.useMemo(() => {
        const grouped: Record<string, Movie[]> = {};

        movies.forEach(movie => {
            const movieGenres = movie.genre?.split(',').map(g => g.trim()) || [];
            movieGenres.forEach(genre => {
                if (!grouped[genre]) {
                    grouped[genre] = [];
                }
                grouped[genre].push(movie);
            });
        });

        return grouped;
    }, [movies]);

    const displayGenres = genres || Object.keys(moviesByGenre).slice(0, 6);

    return (
        <div className="genre-showcase">
            {displayGenres.map(genre => {
                const genreMovies = moviesByGenre[genre] || [];
                if (genreMovies.length === 0) return null;

                return (
                    <TrendingSection
                        key={genre}
                        title={`${getGenreEmoji(genre)} ${genre}`}
                        movies={genreMovies}
                    />
                );
            })}
        </div>
    );
}

function getGenreEmoji(genre: string): string {
    const emojiMap: Record<string, string> = {
        'Action': '💥',
        'Adventure': '🗺️',
        'Animation': '🎨',
        'Comedy': '😂',
        'Crime': '🔫',
        'Documentary': '📹',
        'Drama': '🎭',
        'Family': '👨‍👩‍👧‍👦',
        'Fantasy': '🧙',
        'Horror': '👻',
        'Mystery': '🔍',
        'Romance': '💕',
        'Sci-Fi': '🚀',
        'Thriller': '😱',
        'Western': '🤠'
    };

    return emojiMap[genre] || '🎬';
}

const styles = `
.genre-showcase {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}
`;
