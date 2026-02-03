/**
 * UPDATE #67: Recently Added Component
 * Show recently added movies
 */

import React from 'react';
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
    created_at?: string;
}

interface RecentlyAddedProps {
    movies: Movie[];
    limit?: number;
    onViewAll?: () => void;
}

export function RecentlyAdded({ movies, limit = 8, onViewAll }: RecentlyAddedProps) {
    const displayMovies = movies.slice(0, limit);

    return (
        <section className="recently-added">
            <div className="section-header">
                <h2>🆕 Recently Added</h2>
                {movies.length > limit && (
                    <button onClick={onViewAll} className="view-all-btn">
                        View All ({movies.length})
                    </button>
                )}
            </div>

            <div className="recently-grid">
                {displayMovies.map(movie => (
                    <div key={movie.id} className="recently-item">
                        <MovieCard {...movie} />
                        {movie.created_at && (
                            <div className="added-badge">
                                Added {formatTimeAgo(movie.created_at)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

const styles = `
.recently-added {
  margin: 3rem 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.8rem;
}

.view-all-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.view-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.recently-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.recently-item {
  position: relative;
}

.added-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.9);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

@media (max-width: 768px) {
  .recently-grid {
    grid-template-columns: 1fr;
  }
}
`;
