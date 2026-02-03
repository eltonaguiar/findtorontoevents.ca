/**
 * UPDATE #95: Responsive Utilities
 * Breakpoint management and responsive helpers
 */

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints: Record<Breakpoint, number> = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
};

class ResponsiveManager {
    /**
     * Get current breakpoint
     */
    getCurrentBreakpoint(): Breakpoint {
        const width = window.innerWidth;

        if (width >= breakpoints['2xl']) return '2xl';
        if (width >= breakpoints.xl) return 'xl';
        if (width >= breakpoints.lg) return 'lg';
        if (width >= breakpoints.md) return 'md';
        if (width >= breakpoints.sm) return 'sm';
        return 'xs';
    }

    /**
     * Check if current viewport matches breakpoint
     */
    matches(breakpoint: Breakpoint): boolean {
        return window.innerWidth >= breakpoints[breakpoint];
    }

    /**
     * Check if viewport is between breakpoints
     */
    between(min: Breakpoint, max: Breakpoint): boolean {
        const width = window.innerWidth;
        return width >= breakpoints[min] && width < breakpoints[max];
    }

    /**
     * Get responsive value
     */
    getResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>, fallback: T): T {
        const current = this.getCurrentBreakpoint();
        const orderedBreakpoints: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];

        // Find the closest matching breakpoint
        for (const bp of orderedBreakpoints) {
            if (breakpoints[bp] <= window.innerWidth && values[bp] !== undefined) {
                return values[bp]!;
            }
        }

        return fallback;
    }

    /**
     * Create media query listener
     */
    createMediaQuery(breakpoint: Breakpoint): MediaQueryList {
        return window.matchMedia(`(min-width: ${breakpoints[breakpoint]}px)`);
    }
}

export const responsiveManager = new ResponsiveManager();

/**
 * React hook for breakpoints
 */
import { useState, useEffect } from 'react';

export function useBreakpoint(): Breakpoint {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>(
        responsiveManager.getCurrentBreakpoint()
    );

    useEffect(() => {
        const handleResize = () => {
            setBreakpoint(responsiveManager.getCurrentBreakpoint());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return breakpoint;
}

/**
 * React hook for media queries
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mediaQuery.addEventListener('change', handler);

        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

/**
 * React hook for responsive values
 */
export function useResponsiveValue<T>(
    values: Partial<Record<Breakpoint, T>>,
    fallback: T
): T {
    const breakpoint = useBreakpoint();

    return responsiveManager.getResponsiveValue(values, fallback);
}

/**
 * Responsive component wrapper
 */
import React from 'react';

interface ResponsiveProps {
    children: React.ReactNode;
    show?: Breakpoint[];
    hide?: Breakpoint[];
}

export function Responsive({ children, show, hide }: ResponsiveProps) {
    const breakpoint = useBreakpoint();

    if (show && !show.includes(breakpoint)) {
        return null;
    }

    if (hide && hide.includes(breakpoint)) {
        return null;
    }

    return <>{ children } </>;
}
