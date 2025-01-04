interface CacheEntry<T> {
    value: T;
    timestamp: number;
    ttl: number;
}

export class CacheService {
    private cache: Map<string, CacheEntry<any>>;
    private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

    constructor() {
        this.cache = new Map();
        this.startCleanupInterval();
    }

    public set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): void {
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });
    }

    public get<T>(key: string): T | undefined {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return undefined;
        }

        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return undefined;
        }

        return entry.value as T;
    }

    public delete(key: string): void {
        this.cache.delete(key);
    }

    public clear(): void {
        this.cache.clear();
    }

    private isExpired(entry: CacheEntry<any>): boolean {
        return Date.now() - entry.timestamp > entry.ttl;
    }

    private startCleanupInterval(): void {
        setInterval(() => {
            for (const [key, entry] of this.cache.entries()) {
                if (this.isExpired(entry)) {
                    this.cache.delete(key);
                }
            }
        }, 60000); // Clean up every minute
    }

    public has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }
        if (this.isExpired(entry)) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    public getSize(): number {
        return this.cache.size;
    }
} 