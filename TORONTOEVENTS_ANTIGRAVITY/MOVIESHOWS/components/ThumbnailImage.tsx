/**
 * UPDATE #4: Fix Thumbnail Loading with Fallbacks
 * Adds error handling and fallback images
 */

export function ThumbnailImage({ src, alt, className = '' }) {
    const [imgSrc, setImgSrc] = useState(src);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fallbackImages = [
        src,
        src?.replace('w500', 'w780'), // Try higher res
        src?.replace('w500', 'original'), // Try original
        'https://via.placeholder.com/500x750/1a1a1a/666?text=No+Image' // Final fallback
    ];

    const [currentFallbackIndex, setCurrentFallbackIndex] = useState(0);

    const handleError = () => {
        if (currentFallbackIndex < fallbackImages.length - 1) {
            setCurrentFallbackIndex(prev => prev + 1);
            setImgSrc(fallbackImages[currentFallbackIndex + 1]);
        } else {
            setError(true);
            setLoading(false);
        }
    };

    return (
        <div className={`thumbnail-container ${className}`}>
            {loading && !error && (
                <div className="thumbnail-skeleton">
                    <div className="skeleton-shimmer"></div>
                </div>
            )}
            <img
                src={imgSrc}
                alt={alt}
                className={`thumbnail-image ${loading ? 'loading' : ''} ${error ? 'error' : ''}`}
                onLoad={() => setLoading(false)}
                onError={handleError}
                loading="lazy"
            />
        </div>
    );
}
