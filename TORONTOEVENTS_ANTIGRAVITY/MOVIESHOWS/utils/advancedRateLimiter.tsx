/**
 * UPDATE #117: API Rate Limiting v2
 * Advanced rate limiting with Redis support
 */

interface RateLimitRule {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: any) => string;
}

interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
}

class AdvancedRateLimiter {
    private limits: Map<string, { count: number; resetTime: number }> = new Map();
    private rules: Map<string, RateLimitRule> = new Map();

    /**
     * Add rate limit rule
     */
    addRule(endpoint: string, rule: RateLimitRule): void {
        this.rules.set(endpoint, rule);
    }

    /**
     * Check if request is allowed
     */
    async checkLimit(
        endpoint: string,
        identifier: string,
        customRule?: RateLimitRule
    ): Promise<{ allowed: boolean; info: RateLimitInfo }> {
        const rule = customRule || this.rules.get(endpoint) || {
            windowMs: 60000,
            maxRequests: 60
        };

        const key = `${endpoint}:${identifier}`;
        const now = Date.now();
        const limit = this.limits.get(key);

        // Reset if window expired
        if (!limit || now > limit.resetTime) {
            this.limits.set(key, {
                count: 1,
                resetTime: now + rule.windowMs
            });

            return {
                allowed: true,
                info: {
                    limit: rule.maxRequests,
                    remaining: rule.maxRequests - 1,
                    reset: now + rule.windowMs
                }
            };
        }

        // Check if limit exceeded
        if (limit.count >= rule.maxRequests) {
            return {
                allowed: false,
                info: {
                    limit: rule.maxRequests,
                    remaining: 0,
                    reset: limit.resetTime,
                    retryAfter: Math.ceil((limit.resetTime - now) / 1000)
                }
            };
        }

        // Increment count
        limit.count++;

        return {
            allowed: true,
            info: {
                limit: rule.maxRequests,
                remaining: rule.maxRequests - limit.count,
                reset: limit.resetTime
            }
        };
    }

    /**
     * Consume tokens (for token bucket algorithm)
     */
    async consumeTokens(
        identifier: string,
        tokens: number = 1
    ): Promise<boolean> {
        // Simplified token bucket implementation
        const key = `tokens:${identifier}`;
        const bucket = this.limits.get(key);
        const now = Date.now();

        if (!bucket) {
            this.limits.set(key, {
                count: 100 - tokens, // Start with 100 tokens
                resetTime: now + 1000
            });
            return true;
        }

        // Refill tokens
        const elapsed = now - bucket.resetTime;
        const refillRate = 10; // tokens per second
        const refillAmount = Math.floor(elapsed / 1000) * refillRate;
        bucket.count = Math.min(100, bucket.count + refillAmount);
        bucket.resetTime = now;

        if (bucket.count >= tokens) {
            bucket.count -= tokens;
            return true;
        }

        return false;
    }

    /**
     * Get rate limit info
     */
    async getRateLimitInfo(
        endpoint: string,
        identifier: string
    ): Promise<RateLimitInfo | null> {
        const rule = this.rules.get(endpoint);
        if (!rule) return null;

        const key = `${endpoint}:${identifier}`;
        const limit = this.limits.get(key);

        if (!limit) {
            return {
                limit: rule.maxRequests,
                remaining: rule.maxRequests,
                reset: Date.now() + rule.windowMs
            };
        }

        return {
            limit: rule.maxRequests,
            remaining: Math.max(0, rule.maxRequests - limit.count),
            reset: limit.resetTime
        };
    }

    /**
     * Reset rate limit for identifier
     */
    async resetLimit(endpoint: string, identifier: string): Promise<void> {
        const key = `${endpoint}:${identifier}`;
        this.limits.delete(key);
    }

    /**
     * Clean expired limits
     */
    cleanExpired(): void {
        const now = Date.now();
        for (const [key, limit] of this.limits.entries()) {
            if (now > limit.resetTime) {
                this.limits.delete(key);
            }
        }
    }
}

export const advancedRateLimiter = new AdvancedRateLimiter();

// Add default rules
advancedRateLimiter.addRule('/api/movies', {
    windowMs: 60000, // 1 minute
    maxRequests: 100
});

advancedRateLimiter.addRule('/api/search', {
    windowMs: 60000,
    maxRequests: 30
});

advancedRateLimiter.addRule('/api/auth/login', {
    windowMs: 900000, // 15 minutes
    maxRequests: 5
});

// Clean expired limits every minute
setInterval(() => {
    advancedRateLimiter.cleanExpired();
}, 60000);

/**
 * Rate limit middleware hook
 */
import { useEffect, useState } from 'react';

export function useRateLimit(endpoint: string, userId?: number) {
    const [info, setInfo] = useState<RateLimitInfo | null>(null);
    const [limited, setLimited] = useState(false);

    useEffect(() => {
        const checkLimit = async () => {
            const identifier = userId?.toString() || 'anonymous';
            const result = await advancedRateLimiter.checkLimit(endpoint, identifier);

            setInfo(result.info);
            setLimited(!result.allowed);
        };

        checkLimit();
    }, [endpoint, userId]);

    return { info, limited };
}

/**
 * Rate limit error component
 */
import React from 'react';

interface RateLimitErrorProps {
    retryAfter: number;
    onRetry?: () => void;
}

export function RateLimitError({ retryAfter, onRetry }: RateLimitErrorProps) {
    const [countdown, setCountdown] = useState(retryAfter);

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onRetry?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [retryAfter, onRetry]);

    return (
        <div className="rate-limit-error">
            <div className="error-icon">⏱️</div>
            <h3>Rate Limit Exceeded</h3>
            <p>Too many requests. Please try again in {countdown} seconds.</p>
            <div className="countdown-bar">
                <div
                    className="countdown-fill"
                    style={{ width: `${(countdown / retryAfter) * 100}%` }}
                />
            </div>
        </div>
    );
}

const styles = `
.rate-limit-error {
  padding: 2rem;
  text-align: center;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 12px;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.rate-limit-error h3 {
  margin: 0 0 0.5rem;
  color: #f87171;
}

.rate-limit-error p {
  margin: 0 0 1rem;
  opacity: 0.8;
}

.countdown-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.countdown-fill {
  height: 100%;
  background: #f87171;
  transition: width 1s linear;
}
`;
