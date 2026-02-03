/**
 * UPDATE #66: Trending Section Component
 * Display trending movies in a horizontal scroll
 */

import React, { useEffect, useState } from 'react';
import { MovieCard } from './MovieCard';

interface Movie {
    id: number;
    title: string;
    type?: string;
    release_year?: number;
    genre?: string;
    description?: string;
    thumbnail?: string;
    rating?: number;
}

interface TrendingSectionProps {
    title?: string;
    movies: Movie[];
    loading?: boolean;
    onMovieClick?: (movieId: number) => void;
}

export function TrendingSection({
    title = '🔥 Trending Now',
    movies,
    loading = false,
    onMovieClick
}: TrendingSectionProps) {
    const [scrollPosition, setScrollPosition] = useState(0);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        const container = scrollRef.current;
        if (!container) return;

        const scrollAmount = container.clientWidth * 0.8;
        const newPosition = direction === 'left'
            ? scrollPosition - scrollAmount
            : scrollPosition + scrollAmount;

        container.scrollTo({ left: newPosition, behavior: 'smooth' });
        setScrollPosition(newPosition);
    };

    if (loading) {
        return (
            <section className="trending-section">
                <h2>{title}</h2>
                <div className="trending-scroll">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="trending-card-skeleton" />
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section className="trending-section">
            <div className="trending-header">
                <h2>{title}</h2>
                <div className="trending-controls">
                    <button onClick={() => scroll('left')} className="scroll-btn">←</button>
                    <button onClick={() => scroll('right')} className="scroll-btn">→</button>
                </div>
            </div>

            <div className="trending-scroll" ref={scrollRef}>
                {movies.map(movie => (
                    <div key={movie.id} className="trending-card" onClick={() => onMovieClick?.(movie.id)}>
                        <MovieCard {...movie} />
                    </div>
                ))}
            </div>
        </section>
    );
}

const styles = `
.trending-section {
  margin: 3rem 0;
}

.trending-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.trending-header h2 {
  margin: 0;
  font-size: 1.8rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.trending-controls {
  display: flex;
  gap: 0.5rem;
}

.scroll-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.scroll-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.trending-scroll {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 1rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(102, 126, 234, 0.5) rgba(0, 0, 0, 0.3);
}

.trending-scroll::-webkit-scrollbar {
  height: 8px;
}

.trending-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.trending-scroll::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 4px;
}

.trending-card {
  min-width: 300px;
  flex-shrink: 0;
}

.trending-card-skeleton {
  min-width: 300px;
  height: 400px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  animation: pulse 1.5s ease-in-out infinite;
}

@media (max-width: 768px) {
  .trending-card {
    min-width: 250px;
  }
}
`;
