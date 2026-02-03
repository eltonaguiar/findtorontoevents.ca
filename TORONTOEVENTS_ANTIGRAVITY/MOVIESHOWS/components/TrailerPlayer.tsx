/**
 * UPDATE #5: Trailer Player with Failover
 * Automatically tries alternative trailers if primary fails
 */

export function TrailerPlayer({ trailers, movieTitle }) {
    const [currentTrailerIndex, setCurrentTrailerIndex] = useState(0);
    const [error, setError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const currentTrailer = trailers[currentTrailerIndex];

    const handleError = () => {
        console.log(`Trailer failed: ${currentTrailer?.youtube_id}`);

        // Try next trailer
        if (currentTrailerIndex < trailers.length - 1) {
            console.log(`Trying alternative trailer ${currentTrailerIndex + 1}`);
            setCurrentTrailerIndex(prev => prev + 1);
            setError(false);
            setRetryCount(0);
        } else if (retryCount < 2) {
            // Retry current trailer
            console.log(`Retrying trailer ${retryCount + 1}/2`);
            setRetryCount(prev => prev + 1);
            setError(false);
        } else {
            setError(true);
        }
    };

    if (!trailers || trailers.length === 0) {
        return (
            <div className="trailer-error">
                <p>No trailer available for {movieTitle}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="trailer-error">
                <p>Unable to load trailer</p>
                <button onClick={() => {
                    setCurrentTrailerIndex(0);
                    setError(false);
                    setRetryCount(0);
                }}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="trailer-player">
            <iframe
                key={`${currentTrailer.youtube_id}-${retryCount}`}
                src={`https://www.youtube.com/embed/${currentTrailer.youtube_id}?autoplay=1&mute=0&controls=1&rel=0`}
                title={currentTrailer.title || movieTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={handleError}
            />
            {trailers.length > 1 && (
                <div className="trailer-alternatives">
                    {trailers.map((trailer, idx) => (
                        <button
                            key={trailer.id}
                            className={idx === currentTrailerIndex ? 'active' : ''}
                            onClick={() => {
                                setCurrentTrailerIndex(idx);
                                setError(false);
                                setRetryCount(0);
                            }}
                        >
                            Trailer {idx + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
