/**
 * UPDATE #94: Mobile-First Components
 * Optimized components for mobile devices
 */

import React from 'react';

/**
 * Mobile Navigation
 */
interface MobileNavProps {
    isOpen: boolean;
    onClose: () => void;
    items: { label: string; href: string; icon?: string }[];
}

export function MobileNav({ isOpen, onClose, items }: MobileNavProps) {
    return (
        <>
            {isOpen && <div className="mobile-nav-overlay" onClick={onClose} />}

            <nav className={`mobile-nav ${isOpen ? 'open' : ''}`}>
                <div className="mobile-nav-header">
                    <h2>Menu</h2>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>

                <ul className="mobile-nav-list">
                    {items.map((item, index) => (
                        <li key={index}>
                            <a href={item.href} onClick={onClose}>
                                {item.icon && <span className="nav-icon">{item.icon}</span>}
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}

/**
 * Mobile Bottom Bar
 */
interface BottomBarProps {
    items: { label: string; icon: string; onClick: () => void; active?: boolean }[];
}

export function MobileBottomBar({ items }: BottomBarProps) {
    return (
        <div className="mobile-bottom-bar">
            {items.map((item, index) => (
                <button
                    key={index}
                    onClick={item.onClick}
                    className={`bottom-bar-item ${item.active ? 'active' : ''}`}
                >
                    <span className="item-icon">{item.icon}</span>
                    <span className="item-label">{item.label}</span>
                </button>
            ))}
        </div>
    );
}

/**
 * Pull to Refresh
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
    const [isPulling, setIsPulling] = React.useState(false);
    const [pullDistance, setPullDistance] = React.useState(0);
    const startY = React.useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY === 0) {
            startY.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY.current === 0) return;

        const currentY = e.touches[0].clientY;
        const distance = currentY - startY.current;

        if (distance > 0) {
            setPullDistance(Math.min(distance, 100));
            setIsPulling(distance > 60);
        }
    };

    const handleTouchEnd = async () => {
        if (isPulling) {
            await onRefresh();
        }

        startY.current = 0;
        setPullDistance(0);
        setIsPulling(false);
    };

    return {
        pullDistance,
        isPulling,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd
        }
    };
}

const styles = `
.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.mobile-nav {
  position: fixed;
  top: 0;
  left: -100%;
  width: 80%;
  max-width: 300px;
  height: 100%;
  background: rgba(20, 20, 20, 0.98);
  z-index: 999;
  transition: left 0.3s;
  overflow-y: auto;
}

.mobile-nav.open {
  left: 0;
}

.mobile-nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-nav-header h2 {
  margin: 0;
}

.close-btn {
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
}

.mobile-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.mobile-nav-list li a {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  color: white;
  text-decoration: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s;
}

.mobile-nav-list li a:active {
  background: rgba(255, 255, 255, 0.1);
}

.nav-icon {
  font-size: 1.5rem;
}

.mobile-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: rgba(20, 20, 20, 0.98);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.bottom-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.bottom-bar-item.active {
  color: #667eea;
}

.item-icon {
  font-size: 1.5rem;
}

.item-label {
  font-size: 0.75rem;
}

@media (min-width: 769px) {
  .mobile-bottom-bar {
    display: none;
  }
}
`;
