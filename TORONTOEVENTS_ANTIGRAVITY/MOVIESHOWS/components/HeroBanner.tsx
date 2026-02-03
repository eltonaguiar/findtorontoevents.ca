/**
 * UPDATE #69: Hero Banner Component
 * Featured movie banner with auto-rotate
 */

import React, { useState, useEffect } from 'react';

interface HeroMovie {
    id: number;
    title: string;
    description?: string;
    backdrop?: string;
    release_year?: number;
    genre?: string;
    rating?: number;
}

interface HeroBannerProps {
    movies: HeroMovie[];
    autoRotate?: boolean;
    rotateInterval?: number;
    onPlayTrailer?: (movieId: number) => void;
    onAddToQueue?: (movieId: number) => void;
}

export function HeroBanner({
    movies,
    autoRotate = true,
    rotateInterval = 5000,
    onPlayTrailer,
    onAddToQueue
}: HeroBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentMovie = movies[currentIndex];

    useEffect(() => {
        if (!autoRotate || movies.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % movies.length);
        }, rotateInterval);

        return () => clearInterval(timer);
    }, [autoRotate, movies.length, rotateInterval]);

    if (!currentMovie) return null;

    return (
        <div className="hero-banner">
            <div
                className="hero-background"
                style={{ backgroundImage: `url(${currentMovie.backdrop})` }}
            >
                <div className="hero-overlay" />
            </div>

            <div className="hero-content">
                <h1 className="hero-title">{currentMovie.title}</h1>

                <div className="hero-meta">
                    {currentMovie.release_year && <span>{currentMovie.release_year}</span>}
                    {currentMovie.genre && <span>{currentMovie.genre}</span>}
                    {currentMovie.rating && <span>⭐ {currentMovie.rating.toFixed(1)}</span>}
                </div>

                {currentMovie.description && (
                    <p className="hero-description">
                        {currentMovie.description.slice(0, 200)}...
                    </p>
                )}

                <div className="hero-actions">
                    <button
                        onClick={() => onPlayTrailer?.(currentMovie.id)}
                        className="hero-btn hero-btn-primary"
                    >
                        ▶ Watch Trailer
                    </button>
                    <button
                        onClick={() => onAddToQueue?.(currentMovie.id)}
                        className="hero-btn hero-btn-secondary"
                    >
                        + Add to Queue
                    </button>
                </div>

                {movies.length > 1 && (
                    <div className="hero-indicators">
                        {movies.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = `
.hero-banner {
  position: relative;
  height: 70vh;
  min-height: 500px;
  display: flex;
  align-items: center;
  margin-bottom: 3rem;
  border-radius: 16px;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  animation: zoomIn 20s ease-out infinite;
}

@keyframes zoomIn {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.7) 50%,
    rgba(0, 0, 0, 0.3) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 600px;
  padding: 3rem;
}

.hero-title {
  font-size: 3.5rem;
  margin: 0 0 1rem;
  font-weight: 800;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  animation: fadeInUp 0.8s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  animation: fadeInUp 0.8s 0.2s both;
}

.hero-meta span {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  backdrop-filter: blur(10px);
}

.hero-description {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  opacity: 0.9;
  animation: fadeInUp 0.8s 0.4s both;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  animation: fadeInUp 0.8s 0.6s both;
}

.hero-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.hero-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.hero-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.hero-btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.hero-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.hero-indicators {
  display: flex;
  gap: 0.5rem;
  margin-top: 2rem;
}

.indicator {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.3s;
}

.indicator.active {
  background: white;
  width: 60px;
}

@media (max-width: 768px) {
  .hero-banner {
    height: 60vh;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-content {
    padding: 2rem;
  }

  .hero-actions {
    flex-direction: column;
  }
}
`;
