/**
 * UPDATE #118: Microservices Architecture
 * Service mesh and inter-service communication
 */

interface Service {
    name: string;
    url: string;
    version: string;
    healthy: boolean;
    dependencies: string[];
}

interface ServiceRequest {
    service: string;
    method: string;
    path: string;
    body?: any;
    headers?: Record<string, string>;
}

class ServiceMesh {
    private services: Map<string, Service> = new Map();
    private circuitBreakers: Map<string, CircuitBreaker> = new Map();

    /**
     * Register service
     */
    registerService(service: Service): void {
        this.services.set(service.name, service);
        this.circuitBreakers.set(service.name, new CircuitBreaker(service.name));
    }

    /**
     * Call service
     */
    async callService<T>(request: ServiceRequest): Promise<T> {
        const service = this.services.get(request.service);

        if (!service) {
            throw new Error(`Service ${request.service} not found`);
        }

        if (!service.healthy) {
            throw new Error(`Service ${request.service} is unhealthy`);
        }

        const circuitBreaker = this.circuitBreakers.get(request.service)!;

        return circuitBreaker.execute(async () => {
            const url = `${service.url}${request.path}`;

            const response = await fetch(url, {
                method: request.method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Service-Version': service.version,
                    ...request.headers
                },
                body: request.body ? JSON.stringify(request.body) : undefined
            });

            if (!response.ok) {
                throw new Error(`Service call failed: ${response.statusText}`);
            }

            return response.json();
        });
    }

    /**
     * Get service health
     */
    async checkServiceHealth(serviceName: string): Promise<boolean> {
        const service = this.services.get(serviceName);
        if (!service) return false;

        try {
            const response = await fetch(`${service.url}/health`, {
                signal: AbortSignal.timeout(5000)
            });

            service.healthy = response.ok;
            return response.ok;
        } catch (error) {
            service.healthy = false;
            return false;
        }
    }

    /**
     * Get service dependency graph
     */
    getDependencyGraph(): Map<string, string[]> {
        const graph = new Map<string, string[]>();

        for (const [name, service] of this.services.entries()) {
            graph.set(name, service.dependencies);
        }

        return graph;
    }
}

/**
 * Circuit Breaker Pattern
 */
class CircuitBreaker {
    private state: 'closed' | 'open' | 'half-open' = 'closed';
    private failureCount = 0;
    private successCount = 0;
    private lastFailureTime = 0;
    private readonly failureThreshold = 5;
    private readonly successThreshold = 2;
    private readonly timeout = 60000; // 1 minute

    constructor(private serviceName: string) { }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'half-open';
                this.successCount = 0;
            } else {
                throw new Error(`Circuit breaker open for ${this.serviceName}`);
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.failureCount = 0;

        if (this.state === 'half-open') {
            this.successCount++;

            if (this.successCount >= this.successThreshold) {
                this.state = 'closed';
                this.successCount = 0;
            }
        }
    }

    private onFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.failureThreshold) {
            this.state = 'open';
        }
    }

    getState(): string {
        return this.state;
    }
}

export const serviceMesh = new ServiceMesh();

// Register services
serviceMesh.registerService({
    name: 'auth',
    url: 'https://auth.movieshows.com',
    version: '1.0.0',
    healthy: true,
    dependencies: []
});

serviceMesh.registerService({
    name: 'content',
    url: 'https://content.movieshows.com',
    version: '1.0.0',
    healthy: true,
    dependencies: ['auth']
});

serviceMesh.registerService({
    name: 'recommendations',
    url: 'https://recommendations.movieshows.com',
    version: '1.0.0',
    healthy: true,
    dependencies: ['auth', 'content']
});

serviceMesh.registerService({
    name: 'analytics',
    url: 'https://analytics.movieshows.com',
    version: '1.0.0',
    healthy: true,
    dependencies: ['auth']
});

/**
 * Service client helpers
 */
export const authService = {
    login: (email: string, password: string) =>
        serviceMesh.callService({
            service: 'auth',
            method: 'POST',
            path: '/login',
            body: { email, password }
        }),

    verify: (token: string) =>
        serviceMesh.callService({
            service: 'auth',
            method: 'POST',
            path: '/verify',
            body: { token }
        })
};

export const contentService = {
    getMovies: (filters?: any) =>
        serviceMesh.callService({
            service: 'content',
            method: 'GET',
            path: `/movies${filters ? `?${new URLSearchParams(filters)}` : ''}`
        }),

    getMovie: (id: number) =>
        serviceMesh.callService({
            service: 'content',
            method: 'GET',
            path: `/movies/${id}`
        })
};

export const recommendationsService = {
    getRecommendations: (userId: number) =>
        serviceMesh.callService({
            service: 'recommendations',
            method: 'GET',
            path: `/recommendations/${userId}`
        })
};
