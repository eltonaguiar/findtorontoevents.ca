/**
 * UPDATE #85: Rate Limiting System
 * Protect API from abuse
 */

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;

        // Cleanup old entries every minute
        setInterval(() => this.cleanup(), 60000);
    }

    /**
     * Check if request is allowed
     */
    isAllowed(identifier: string): boolean {
        const now = Date.now();
        const entry = this.limits.get(identifier);

        if (!entry || now > entry.resetTime) {
            // New window
            this.limits.set(identifier, {
                count: 1,
                resetTime: now + this.config.windowMs
            });
            return true;
        }

        if (entry.count < this.config.maxRequests) {
            entry.count++;
            return true;
        }

        return false;
    }

    /**
     * Get remaining requests
     */
    getRemaining(identifier: string): number {
        const entry = this.limits.get(identifier);
        if (!entry || Date.now() > entry.resetTime) {
            return this.config.maxRequests;
        }
        return Math.max(0, this.config.maxRequests - entry.count);
    }

    /**
     * Get reset time
     */
    getResetTime(identifier: string): number {
        const entry = this.limits.get(identifier);
        if (!entry) {
            return Date.now() + this.config.windowMs;
        }
        return entry.resetTime;
    }

    /**
     * Reset limit for identifier
     */
    reset(identifier: string): void {
        this.limits.delete(identifier);
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.limits.entries()) {
            if (now > entry.resetTime) {
                this.limits.delete(key);
            }
        }
    }
}

// Pre-configured rate limiters
export const apiRateLimiter = new RateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 60 // 60 requests per minute
});

export const authRateLimiter = new RateLimiter({
    windowMs: 900000, // 15 minutes
    maxRequests: 5 // 5 login attempts per 15 minutes
});

export const commentRateLimiter = new RateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 10 // 10 comments per minute
});

/**
 * Middleware for rate limiting
 */
export function withRateLimit(
    rateLimiter: RateLimiter,
    identifier: string
): { allowed: boolean; remaining: number; resetTime: number } {
    const allowed = rateLimiter.isAllowed(identifier);
    const remaining = rateLimiter.getRemaining(identifier);
    const resetTime = rateLimiter.getResetTime(identifier);

    return { allowed, remaining, resetTime };
}

/**
 * React hook for rate limiting
 */
import { useState, useCallback } from 'react';

export function useRateLimit(rateLimiter: RateLimiter, identifier: string) {
    const [isLimited, setIsLimited] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const [resetTime, setResetTime] = useState(0);

    const checkLimit = useCallback(() => {
        const result = withRateLimit(rateLimiter, identifier);
        setIsLimited(!result.allowed);
        setRemaining(result.remaining);
        setResetTime(result.resetTime);
        return result.allowed;
    }, [rateLimiter, identifier]);

    return {
        isLimited,
        remaining,
        resetTime,
        checkLimit
    };
}
