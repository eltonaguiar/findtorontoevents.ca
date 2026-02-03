/**
 * UPDATE #6: Loading States Component
 * Skeleton loaders for better UX
 */

export function MovieSkeleton() {
    return (
        <div className="movie-skeleton">
            <div className="skeleton-thumbnail">
                <div className="skeleton-shimmer"></div>
            </div>
            <div className="skeleton-info">
                <div className="skeleton-title"></div>
                <div className="skeleton-meta"></div>
                <div className="skeleton-description"></div>
            </div>
        </div>
    );
}

export function LoadingSpinner({ size = 'medium', message = 'Loading...' }) {
    return (
        <div className={`loading-spinner ${size}`}>
            <div className="spinner"></div>
            {message && <p>{message}</p>}
        </div>
    );
}

export function FullPageLoader({ message = 'Loading MovieShows...' }) {
    return (
        <div className="full-page-loader">
            <LoadingSpinner size="large" message={message} />
        </div>
    );
}

// CSS for skeletons
const skeletonStyles = `
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.05) 0%,
    rgba(255,255,255,0.1) 50%,
    rgba(255,255,255,0.05) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.movie-skeleton {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: rgba(255,255,255,0.02);
}

.skeleton-thumbnail {
  width: 150px;
  height: 225px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255,255,255,0.05);
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-title {
  height: 24px;
  width: 60%;
  border-radius: 4px;
  background: rgba(255,255,255,0.05);
}

.skeleton-meta {
  height: 16px;
  width: 40%;
  border-radius: 4px;
  background: rgba(255,255,255,0.05);
}

.skeleton-description {
  height: 60px;
  width: 100%;
  border-radius: 4px;
  background: rgba(255,255,255,0.05);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-spinner.small .spinner {
  width: 20px;
  height: 20px;
}

.loading-spinner.medium .spinner {
  width: 40px;
  height: 40px;
}

.loading-spinner.large .spinner {
  width: 60px;
  height: 60px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.full-page-loader {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.9);
  z-index: 9999;
}
`;
