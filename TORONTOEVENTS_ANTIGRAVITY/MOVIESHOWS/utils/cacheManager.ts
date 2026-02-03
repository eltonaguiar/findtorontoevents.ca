/**
 * UPDATE #86: Advanced Caching Strategy
 * Multi-layer caching system
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

class CacheManager {
    private memoryCache: Map<string, CacheEntry<any>> = new Map();
    private readonly MAX_MEMORY_ITEMS = 100;

    /**
     * Set item in cache
     */
    set<T>(key: string, data: T, ttl: number = 300000): void {
        // Memory cache
        this.memoryCache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });

        // Enforce max items
        if (this.memoryCache.size > this.MAX_MEMORY_ITEMS) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }

        // LocalStorage cache (for persistence)
        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify({
                data,
                timestamp: Date.now(),
                ttl
            }));
        } catch (error) {
            console.warn('LocalStorage cache failed:', error);
        }
    }

    /**
     * Get item from cache
     */
    get<T>(key: string): T | null {
        // Try memory cache first
        const memEntry = this.memoryCache.get(key);
        if (memEntry && this.isValid(memEntry)) {
            return memEntry.data;
        }

        // Try localStorage
        try {
            const stored = localStorage.getItem(`cache_${key}`);
            if (stored) {
                const entry: CacheEntry<T> = JSON.parse(stored);
                if (this.isValid(entry)) {
                    // Restore to memory cache
                    this.memoryCache.set(key, entry);
                    return entry.data;
                }
            }
        } catch (error) {
            console.warn('LocalStorage read failed:', error);
        }

        return null;
    }

    /**
     * Check if item exists and is valid
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Delete item from cache
     */
    delete(key: string): void {
        this.memoryCache.delete(key);
        try {
            localStorage.removeItem(`cache_${key}`);
        } catch (error) {
            console.warn('LocalStorage delete failed:', error);
        }
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.memoryCache.clear();

        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('cache_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('LocalStorage clear failed:', error);
        }
    }

    /**
     * Get cache stats
     */
    getStats(): {
        memoryItems: number;
        memorySize: number;
        storageItems: number;
    } {
        let storageItems = 0;
        try {
            const keys = Object.keys(localStorage);
            storageItems = keys.filter(k => k.startsWith('cache_')).length;
        } catch (error) {
            // Ignore
        }

        return {
            memoryItems: this.memoryCache.size,
            memorySize: this.estimateSize(),
            storageItems
        };
    }

    private isValid<T>(entry: CacheEntry<T>): boolean {
        return Date.now() - entry.timestamp < entry.ttl;
    }

    private estimateSize(): number {
        let size = 0;
        this.memoryCache.forEach(entry => {
            size += JSON.stringify(entry.data).length;
        });
        return size;
    }
}

export const cacheManager = new CacheManager();

/**
 * Cache decorator for functions
 */
export function cached<T>(
    key: string,
    ttl: number = 300000
): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const cacheKey = `${key}_${JSON.stringify(args)}`;

            // Check cache
            const cached = cacheManager.get<T>(cacheKey);
            if (cached !== null) {
                return cached;
            }

            // Execute and cache
            const result = await originalMethod.apply(this, args);
            cacheManager.set(cacheKey, result, ttl);
            return result;
        };

        return descriptor;
    };
}

/**
 * React hook for cached data
 */
import { useState, useEffect } from 'react';

export function useCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300000
): { data: T | null; loading: boolean; error: Error | null } {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            // Check cache first
            const cached = cacheManager.get<T>(key);
            if (cached !== null) {
                setData(cached);
                setLoading(false);
                return;
            }

            // Fetch fresh data
            try {
                const result = await fetcher();
                cacheManager.set(key, result, ttl);
                setData(result);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [key, ttl]);

    return { data, loading, error };
}
