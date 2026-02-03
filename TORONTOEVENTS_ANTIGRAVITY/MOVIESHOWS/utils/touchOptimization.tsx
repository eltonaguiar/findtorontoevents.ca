/**
 * UPDATE #96: Touch Optimization
 * Enhanced touch interactions
 */

interface TouchGestureHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onPinch?: (scale: number) => void;
    onDoubleTap?: () => void;
    onLongPress?: () => void;
}

export function useTouchGestures(handlers: TouchGestureHandlers) {
    const touchStart = React.useRef({ x: 0, y: 0, time: 0 });
    const touchEnd = React.useRef({ x: 0, y: 0 });
    const lastTap = React.useRef(0);
    const longPressTimer = React.useRef<NodeJS.Timeout>();

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStart.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };

        // Long press detection
        if (handlers.onLongPress) {
            longPressTimer.current = setTimeout(() => {
                handlers.onLongPress?.();
            }, 500);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // Cancel long press if moved
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }

        // Pinch detection
        if (e.touches.length === 2 && handlers.onPinch) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            // Calculate scale (simplified)
            handlers.onPinch(distance / 100);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }

        const touch = e.changedTouches[0];
        touchEnd.current = {
            x: touch.clientX,
            y: touch.clientY
        };

        const deltaX = touchEnd.current.x - touchStart.current.x;
        const deltaY = touchEnd.current.y - touchStart.current.y;
        const deltaTime = Date.now() - touchStart.current.time;

        // Double tap detection
        if (deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            const now = Date.now();
            if (now - lastTap.current < 300 && handlers.onDoubleTap) {
                handlers.onDoubleTap();
                lastTap.current = 0;
                return;
            }
            lastTap.current = now;
        }

        // Swipe detection
        const minSwipeDistance = 50;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    handlers.onSwipeRight?.();
                } else {
                    handlers.onSwipeLeft?.();
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    handlers.onSwipeDown?.();
                } else {
                    handlers.onSwipeUp?.();
                }
            }
        }
    };

    return {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd
    };
}

/**
 * Haptic feedback
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'medium'): void {
    if ('vibrate' in navigator) {
        const patterns = {
            light: 10,
            medium: 20,
            heavy: 30
        };
        navigator.vibrate(patterns[type]);
    }
}

/**
 * Touch-friendly button component
 */
import React from 'react';

interface TouchButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    haptic?: boolean;
    className?: string;
}

export function TouchButton({ children, onClick, haptic = true, className = '' }: TouchButtonProps) {
    const handleClick = () => {
        if (haptic) {
            hapticFeedback('light');
        }
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            className={`touch-button ${className}`}
            style={{
                minHeight: '44px',
                minWidth: '44px',
                touchAction: 'manipulation'
            }}
        >
            {children}
        </button>
    );
}

const styles = `
.touch-button {
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  cursor: pointer;
}

.touch-button:active {
  transform: scale(0.95);
  transition: transform 0.1s;
}
`;
