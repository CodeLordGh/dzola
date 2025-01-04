import * as vscode from 'vscode';

interface PerformanceMetric {
    operation: string;
    duration: number;
    timestamp: string;
    success: boolean;
}

interface HealthCheck {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: string;
    details?: string;
}

export class MonitoringService {
    private metrics: PerformanceMetric[] = [];
    private healthChecks: Map<string, HealthCheck> = new Map();
    private readonly MAX_METRICS = 1000;

    constructor(
        private readonly logger: vscode.OutputChannel
    ) {
        this.startPeriodicHealthChecks();
    }

    trackPerformance<T>(operation: string, task: () => Promise<T>): Promise<T> {
        const startTime = Date.now();
        let success = true;

        return task()
            .catch(error => {
                success = false;
                throw error;
            })
            .finally(() => {
                const duration = Date.now() - startTime;
                this.recordMetric({
                    operation,
                    duration,
                    timestamp: new Date().toISOString(),
                    success
                });
            });
    }

    private recordMetric(metric: PerformanceMetric): void {
        this.metrics.push(metric);
        if (this.metrics.length > this.MAX_METRICS) {
            this.metrics.shift();
        }
        this.logMetric(metric);
    }

    private logMetric(metric: PerformanceMetric): void {
        this.logger.appendLine(
            `[METRIC] ${metric.timestamp} - ${metric.operation} - ` +
            `Duration: ${metric.duration}ms - Success: ${metric.success}`
        );
    }

    async checkHealth(service: string): Promise<HealthCheck> {
        try {
            // Perform service-specific health check
            const status = await this.performHealthCheck(service);
            const healthCheck: HealthCheck = {
                service,
                status,
                lastCheck: new Date().toISOString()
            };
            
            this.healthChecks.set(service, healthCheck);
            this.logHealthCheck(healthCheck);
            
            return healthCheck;
        } catch (error: any) {
            const healthCheck: HealthCheck = {
                service,
                status: 'unhealthy',
                lastCheck: new Date().toISOString(),
                details: error.message
            };
            
            this.healthChecks.set(service, healthCheck);
            this.logHealthCheck(healthCheck);
            
            return healthCheck;
        }
    }

    private async performHealthCheck(service: string): Promise<'healthy' | 'degraded' | 'unhealthy'> {
        // Implement service-specific health checks
        switch (service) {
            case 'AIService':
                // Check AI service connectivity
                return 'healthy';
            case 'TestRunner':
                // Check test runner status
                return 'healthy';
            case 'FileWatcher':
                // Check file watcher status
                return 'healthy';
            default:
                return 'healthy';
        }
    }

    private logHealthCheck(healthCheck: HealthCheck): void {
        this.logger.appendLine(
            `[HEALTH] ${healthCheck.lastCheck} - ${healthCheck.service} - ` +
            `Status: ${healthCheck.status}${healthCheck.details ? ` - ${healthCheck.details}` : ''}`
        );
    }

    getMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    getHealthStatus(): Map<string, HealthCheck> {
        return new Map(this.healthChecks);
    }

    private startPeriodicHealthChecks(): void {
        setInterval(() => {
            this.checkHealth('AIService');
            this.checkHealth('TestRunner');
            this.checkHealth('FileWatcher');
        }, 5 * 60 * 1000); // Check every 5 minutes
    }
} 