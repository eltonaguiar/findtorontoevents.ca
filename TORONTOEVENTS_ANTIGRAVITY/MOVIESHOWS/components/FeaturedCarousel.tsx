/**
 * UPDATE #70: Featured Carousel Component
 * Auto-scrolling carousel for featured content
 */

import React, { useState, useEffect, useRef } from 'react';

interface CarouselItem {
    id: number;
    title: string;
    image: string;
    description?: string;
}

interface FeaturedCarouselProps {
    items: CarouselItem[];
    autoPlay?: boolean;
    interval?: number;
    onItemClick?: (id: number) => void;
}

export function FeaturedCarousel({
    items,
    autoPlay = true,
    interval = 4000,
    onItemClick
}: FeaturedCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    useEffect(() => {
        if (!autoPlay || isPaused || items.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, interval);

        return () => clearInterval(timer);
    }, [autoPlay, isPaused, items.length, interval]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current - touchEndX.current > 50) {
            goToNext();
        } else if (touchEndX.current - touchStartX.current > 50) {
            goToPrevious();
        }
    };

    if (items.length === 0) return null;

    return (
        <div
            className="featured-carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div className="carousel-container">
                <div
                    className="carousel-track"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="carousel-slide"
                            onClick={() => onItemClick?.(item.id)}
                        >
                            <img src={item.image} alt={item.title} />
                            <div className="carousel-caption">
                                <h3>{item.title}</h3>
                                {item.description && <p>{item.description}</p>}
                            </div>
                        </div>
                    ))}
                </div>

                <button onClick={goToPrevious} className="carousel-btn carousel-btn-prev">
                    ‹
                </button>
                <button onClick={goToNext} className="carousel-btn carousel-btn-next">
                    ›
                </button>
            </div>

            <div className="carousel-dots">
                {items.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                    />
                ))}
            </div>
        </div>
    );
}

const styles = `
.featured-carousel {
  position: relative;
  margin: 2rem 0;
  border-radius: 16px;
  overflow: hidden;
}

.carousel-container {
  position: relative;
  width: 100%;
  aspect-ratio: 21/9;
  overflow: hidden;
}

.carousel-track {
  display: flex;
  transition: transform 0.5s ease-in-out;
  height: 100%;
}

.carousel-slide {
  min-width: 100%;
  position: relative;
  cursor: pointer;
}

.carousel-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2rem;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
}

.carousel-caption h3 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  font-weight: 700;
}

.carousel-caption p {
  margin: 0;
  opacity: 0.9;
  font-size: 1.1rem;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
  z-index: 10;
}

.carousel-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: translateY(-50%) scale(1.1);
}

.carousel-btn-prev {
  left: 1rem;
}

.carousel-btn-next {
  right: 1rem;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 0;
}

.carousel-dot {
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
}

.carousel-dot.active {
  background: white;
  transform: scale(1.3);
}

@media (max-width: 768px) {
  .carousel-container {
    aspect-ratio: 16/9;
  }

  .carousel-caption h3 {
    font-size: 1.5rem;
  }

  .carousel-btn {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }
}
`;
