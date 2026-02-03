/**
 * UPDATE #84: A/B Testing Framework
 * Run experiments and track results
 */

interface Variant {
    id: string;
    name: string;
    weight: number; // 0-100
}

interface Experiment {
    id: string;
    name: string;
    variants: Variant[];
    active: boolean;
    startDate: string;
    endDate?: string;
}

class ABTestingFramework {
    private experiments: Map<string, Experiment> = new Map();
    private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> experimentId -> variantId

    /**
     * Create a new experiment
     */
    createExperiment(experiment: Experiment): void {
        // Validate weights sum to 100
        const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
        if (Math.abs(totalWeight - 100) > 0.01) {
            throw new Error('Variant weights must sum to 100');
        }

        this.experiments.set(experiment.id, experiment);
    }

    /**
     * Get variant for a user
     */
    getVariant(userId: string, experimentId: string): string | null {
        const experiment = this.experiments.get(experimentId);
        if (!experiment || !experiment.active) {
            return null;
        }

        // Check if user already assigned
        if (!this.userAssignments.has(userId)) {
            this.userAssignments.set(userId, new Map());
        }

        const userExperiments = this.userAssignments.get(userId)!;
        if (userExperiments.has(experimentId)) {
            return userExperiments.get(experimentId)!;
        }

        // Assign variant based on weights
        const variant = this.assignVariant(experiment.variants, userId);
        userExperiments.set(experimentId, variant.id);

        // Track assignment
        this.trackEvent('experiment_assigned', {
            experimentId,
            variantId: variant.id,
            userId
        });

        return variant.id;
    }

    /**
     * Track conversion event
     */
    trackConversion(userId: string, experimentId: string, conversionType: string, value?: number): void {
        const variantId = this.userAssignments.get(userId)?.get(experimentId);
        if (!variantId) return;

        this.trackEvent('conversion', {
            experimentId,
            variantId,
            userId,
            conversionType,
            value
        });
    }

    /**
     * Get experiment results
     */
    getResults(experimentId: string): {
        variant: string;
        assignments: number;
        conversions: number;
        conversionRate: number;
    }[] {
        // In production, this would query analytics
        return [];
    }

    private assignVariant(variants: Variant[], userId: string): Variant {
        // Use userId hash for consistent assignment
        const hash = this.hashString(userId);
        const random = (hash % 10000) / 100; // 0-100

        let cumulative = 0;
        for (const variant of variants) {
            cumulative += variant.weight;
            if (random < cumulative) {
                return variant;
            }
        }

        return variants[variants.length - 1];
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    private trackEvent(eventName: string, data: any): void {
        // In production, send to analytics
        console.log('AB Test Event:', eventName, data);
    }
}

export const abTesting = new ABTestingFramework();

/**
 * React hook for A/B testing
 */
import { useState, useEffect } from 'react';

export function useABTest(experimentId: string, userId: string): string | null {
    const [variant, setVariant] = useState<string | null>(null);

    useEffect(() => {
        const assignedVariant = abTesting.getVariant(userId, experimentId);
        setVariant(assignedVariant);
    }, [experimentId, userId]);

    return variant;
}

/**
 * Track conversion helper
 */
export function trackABConversion(
    userId: string,
    experimentId: string,
    conversionType: string,
    value?: number
): void {
    abTesting.trackConversion(userId, experimentId, conversionType, value);
}
