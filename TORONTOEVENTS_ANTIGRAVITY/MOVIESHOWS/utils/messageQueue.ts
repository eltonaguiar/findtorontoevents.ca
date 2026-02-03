/**
 * UPDATE #120: Message Queue System
 * Async job processing with message queues
 */

interface Job<T = any> {
    id: string;
    type: string;
    payload: T;
    priority: number;
    attempts: number;
    maxAttempts: number;
    createdAt: string;
    scheduledFor?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
}

type JobHandler<T = any> = (payload: T) => Promise<void>;

class MessageQueue {
    private queues: Map<string, Job[]> = new Map();
    private handlers: Map<string, JobHandler> = new Map();
    private processing = false;
    private concurrency = 5;
    private activeJobs = 0;

    /**
     * Register job handler
     */
    registerHandler<T = any>(jobType: string, handler: JobHandler<T>): void {
        this.handlers.set(jobType, handler as JobHandler);
    }

    /**
     * Add job to queue
     */
    async addJob<T = any>(
        jobType: string,
        payload: T,
        options: {
            priority?: number;
            delay?: number;
            maxAttempts?: number;
        } = {}
    ): Promise<string> {
        const job: Job<T> = {
            id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: jobType,
            payload,
            priority: options.priority || 0,
            attempts: 0,
            maxAttempts: options.maxAttempts || 3,
            createdAt: new Date().toISOString(),
            scheduledFor: options.delay
                ? new Date(Date.now() + options.delay).toISOString()
                : undefined,
            status: 'pending'
        };

        if (!this.queues.has(jobType)) {
            this.queues.set(jobType, []);
        }

        const queue = this.queues.get(jobType)!;
        queue.push(job);

        // Sort by priority (higher first)
        queue.sort((a, b) => b.priority - a.priority);

        // Start processing if not already running
        if (!this.processing) {
            this.startProcessing();
        }

        return job.id;
    }

    /**
     * Start processing jobs
     */
    private async startProcessing(): Promise<void> {
        this.processing = true;

        while (this.hasJobs() || this.activeJobs > 0) {
            if (this.activeJobs < this.concurrency) {
                const job = this.getNextJob();

                if (job) {
                    this.activeJobs++;
                    this.processJob(job).finally(() => {
                        this.activeJobs--;
                    });
                } else {
                    // No jobs ready, wait a bit
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } else {
                // At max concurrency, wait
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        this.processing = false;
    }

    /**
     * Get next job to process
     */
    private getNextJob(): Job | null {
        const now = new Date();

        for (const queue of this.queues.values()) {
            for (let i = 0; i < queue.length; i++) {
                const job = queue[i];

                if (job.status !== 'pending') continue;

                // Check if job is scheduled for future
                if (job.scheduledFor && new Date(job.scheduledFor) > now) {
                    continue;
                }

                // Remove from queue and return
                queue.splice(i, 1);
                return job;
            }
        }

        return null;
    }

    /**
     * Process single job
     */
    private async processJob(job: Job): Promise<void> {
        const handler = this.handlers.get(job.type);

        if (!handler) {
            console.error(`No handler registered for job type: ${job.type}`);
            job.status = 'failed';
            job.error = 'No handler registered';
            return;
        }

        job.status = 'processing';
        job.attempts++;

        try {
            await handler(job.payload);
            job.status = 'completed';
        } catch (error) {
            console.error(`Job ${job.id} failed:`, error);

            if (job.attempts >= job.maxAttempts) {
                job.status = 'failed';
                job.error = error instanceof Error ? error.message : 'Unknown error';
            } else {
                // Retry with exponential backoff
                const delay = Math.pow(2, job.attempts) * 1000;
                job.status = 'pending';
                job.scheduledFor = new Date(Date.now() + delay).toISOString();

                // Add back to queue
                const queue = this.queues.get(job.type);
                if (queue) {
                    queue.push(job);
                }
            }
        }
    }

    /**
     * Check if there are jobs to process
     */
    private hasJobs(): boolean {
        for (const queue of this.queues.values()) {
            if (queue.some(job => job.status === 'pending')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get job status
     */
    getJobStatus(jobId: string): Job | null {
        for (const queue of this.queues.values()) {
            const job = queue.find(j => j.id === jobId);
            if (job) return job;
        }
        return null;
    }

    /**
     * Get queue stats
     */
    getStats(): {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    } {
        let total = 0;
        let pending = 0;
        let processing = 0;
        let completed = 0;
        let failed = 0;

        for (const queue of this.queues.values()) {
            total += queue.length;
            pending += queue.filter(j => j.status === 'pending').length;
            processing += queue.filter(j => j.status === 'processing').length;
            completed += queue.filter(j => j.status === 'completed').length;
            failed += queue.filter(j => j.status === 'failed').length;
        }

        return { total, pending, processing, completed, failed };
    }

    /**
     * Clear completed jobs
     */
    clearCompleted(): void {
        for (const queue of this.queues.values()) {
            const pending = queue.filter(j => j.status !== 'completed');
            queue.length = 0;
            queue.push(...pending);
        }
    }
}

export const messageQueue = new MessageQueue();

// Register job handlers
messageQueue.registerHandler('send-email', async (payload: { to: string; subject: string; body: string }) => {
    console.log(`Sending email to ${payload.to}: ${payload.subject}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
});

messageQueue.registerHandler('process-video', async (payload: { videoId: string }) => {
    console.log(`Processing video ${payload.videoId}`);
    await new Promise(resolve => setTimeout(resolve, 5000));
});

messageQueue.registerHandler('generate-thumbnail', async (payload: { movieId: number }) => {
    console.log(`Generating thumbnail for movie ${payload.movieId}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
});

messageQueue.registerHandler('update-recommendations', async (payload: { userId: number }) => {
    console.log(`Updating recommendations for user ${payload.userId}`);
    await new Promise(resolve => setTimeout(resolve, 3000));
});

/**
 * Helper functions
 */
export const queueEmail = (to: string, subject: string, body: string) =>
    messageQueue.addJob('send-email', { to, subject, body });

export const queueVideoProcessing = (videoId: string) =>
    messageQueue.addJob('process-video', { videoId }, { priority: 5 });

export const queueThumbnailGeneration = (movieId: number) =>
    messageQueue.addJob('generate-thumbnail', { movieId });

export const queueRecommendationUpdate = (userId: number) =>
    messageQueue.addJob('update-recommendations', { userId }, { delay: 5000 });
