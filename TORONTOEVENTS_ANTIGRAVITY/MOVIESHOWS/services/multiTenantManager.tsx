/**
 * UPDATE #124: Multi-Tenant Architecture
 * Support multiple tenants on single platform
 */

interface Tenant {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    status: 'active' | 'suspended' | 'trial';
    plan: 'starter' | 'professional' | 'enterprise';
    createdAt: string;
    settings: {
        maxUsers: number;
        maxStorage: number; // GB
        features: string[];
    };
    usage: {
        users: number;
        storage: number;
    };
}

interface TenantContext {
    tenant: Tenant;
    userId?: number;
}

class MultiTenantManager {
    private tenants: Map<string, Tenant> = new Map();
    private currentTenant: Tenant | null = null;

    /**
     * Create tenant
     */
    createTenant(
        name: string,
        slug: string,
        plan: Tenant['plan'],
        domain?: string
    ): Tenant {
        const tenant: Tenant = {
            id: `tenant_${Date.now()}`,
            name,
            slug,
            domain,
            status: plan === 'starter' ? 'trial' : 'active',
            plan,
            createdAt: new Date().toISOString(),
            settings: this.getPlanSettings(plan),
            usage: {
                users: 0,
                storage: 0
            }
        };

        this.tenants.set(tenant.id, tenant);
        return tenant;
    }

    /**
     * Get plan settings
     */
    private getPlanSettings(plan: Tenant['plan']): Tenant['settings'] {
        const settings = {
            starter: {
                maxUsers: 10,
                maxStorage: 5,
                features: ['basic-analytics', 'email-support']
            },
            professional: {
                maxUsers: 100,
                maxStorage: 50,
                features: ['basic-analytics', 'advanced-analytics', 'email-support', 'priority-support', 'custom-branding']
            },
            enterprise: {
                maxUsers: -1, // unlimited
                maxStorage: 500,
                features: ['basic-analytics', 'advanced-analytics', 'email-support', 'priority-support', 'custom-branding', 'white-label', 'api-access', 'sso']
            }
        };

        return settings[plan];
    }

    /**
     * Load tenant by ID
     */
    loadTenant(tenantId: string): Tenant | null {
        const tenant = this.tenants.get(tenantId);
        if (tenant) {
            this.currentTenant = tenant;
        }
        return tenant || null;
    }

    /**
     * Load tenant by slug
     */
    loadTenantBySlug(slug: string): Tenant | null {
        for (const tenant of this.tenants.values()) {
            if (tenant.slug === slug) {
                this.currentTenant = tenant;
                return tenant;
            }
        }
        return null;
    }

    /**
     * Load tenant by domain
     */
    loadTenantByDomain(domain: string): Tenant | null {
        for (const tenant of this.tenants.values()) {
            if (tenant.domain === domain) {
                this.currentTenant = tenant;
                return tenant;
            }
        }
        return null;
    }

    /**
     * Get current tenant
     */
    getCurrentTenant(): Tenant | null {
        return this.currentTenant;
    }

    /**
     * Check if tenant has feature
     */
    hasFeature(tenantId: string, feature: string): boolean {
        const tenant = this.tenants.get(tenantId);
        if (!tenant) return false;

        return tenant.settings.features.includes(feature);
    }

    /**
     * Check usage limits
     */
    checkLimits(tenantId: string): {
        users: { current: number; max: number; exceeded: boolean };
        storage: { current: number; max: number; exceeded: boolean };
    } {
        const tenant = this.tenants.get(tenantId);
        if (!tenant) {
            throw new Error('Tenant not found');
        }

        return {
            users: {
                current: tenant.usage.users,
                max: tenant.settings.maxUsers,
                exceeded: tenant.settings.maxUsers !== -1 && tenant.usage.users >= tenant.settings.maxUsers
            },
            storage: {
                current: tenant.usage.storage,
                max: tenant.settings.maxStorage,
                exceeded: tenant.usage.storage >= tenant.settings.maxStorage
            }
        };
    }

    /**
     * Update tenant usage
     */
    updateUsage(tenantId: string, type: 'users' | 'storage', value: number): void {
        const tenant = this.tenants.get(tenantId);
        if (tenant) {
            tenant.usage[type] = value;
        }
    }

    /**
     * Upgrade tenant plan
     */
    upgradePlan(tenantId: string, newPlan: Tenant['plan']): void {
        const tenant = this.tenants.get(tenantId);
        if (tenant) {
            tenant.plan = newPlan;
            tenant.settings = this.getPlanSettings(newPlan);
            tenant.status = 'active';
        }
    }

    /**
     * Suspend tenant
     */
    suspendTenant(tenantId: string): void {
        const tenant = this.tenants.get(tenantId);
        if (tenant) {
            tenant.status = 'suspended';
        }
    }

    /**
     * Get all tenants
     */
    getAllTenants(): Tenant[] {
        return Array.from(this.tenants.values());
    }
}

export const multiTenantManager = new MultiTenantManager();

// Create example tenants
multiTenantManager.createTenant('ACME Corporation', 'acme', 'enterprise', 'acme.movieshows.com');
multiTenantManager.createTenant('StartupXYZ', 'startupxyz', 'professional');
multiTenantManager.createTenant('SmallBiz', 'smallbiz', 'starter');

/**
 * Tenant context provider
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

const TenantContext = createContext<TenantContext | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const [context, setContext] = useState<TenantContext | null>(null);

    useEffect(() => {
        // Determine tenant from URL
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0];

        // Try to load by domain first
        let tenant = multiTenantManager.loadTenantByDomain(hostname);

        // If not found, try subdomain as slug
        if (!tenant && subdomain !== 'www' && subdomain !== 'localhost') {
            tenant = multiTenantManager.loadTenantBySlug(subdomain);
        }

        // If still not found, check URL parameter
        if (!tenant) {
            const params = new URLSearchParams(window.location.search);
            const tenantSlug = params.get('tenant');
            if (tenantSlug) {
                tenant = multiTenantManager.loadTenantBySlug(tenantSlug);
            }
        }

        if (tenant) {
            setContext({ tenant });
        }
    }, []);

    return (
        <TenantContext.Provider value={context}>
            {children}
        </TenantContext.Provider>
    );
}

/**
 * Hook to use tenant context
 */
export function useTenant(): TenantContext | null {
    return useContext(TenantContext);
}

/**
 * Tenant dashboard component
 */
export function TenantDashboard() {
    const context = useTenant();

    if (!context) {
        return <div>No tenant context</div>;
    }

    const { tenant } = context;
    const limits = multiTenantManager.checkLimits(tenant.id);

    return (
        <div className="tenant-dashboard">
            <h2>{tenant.name}</h2>
            <div className="tenant-info">
                <div className="info-item">
                    <span>Plan:</span>
                    <strong>{tenant.plan}</strong>
                </div>
                <div className="info-item">
                    <span>Status:</span>
                    <strong className={`status-${tenant.status}`}>{tenant.status}</strong>
                </div>
            </div>

            <div className="usage-section">
                <h3>Usage</h3>
                <div className="usage-item">
                    <span>Users:</span>
                    <div className="usage-bar">
                        <div
                            className="usage-fill"
                            style={{
                                width: `${(limits.users.current / limits.users.max) * 100}%`,
                                background: limits.users.exceeded ? '#f87171' : '#4ade80'
                            }}
                        />
                    </div>
                    <span>{limits.users.current} / {limits.users.max === -1 ? '∞' : limits.users.max}</span>
                </div>

                <div className="usage-item">
                    <span>Storage:</span>
                    <div className="usage-bar">
                        <div
                            className="usage-fill"
                            style={{
                                width: `${(limits.storage.current / limits.storage.max) * 100}%`,
                                background: limits.storage.exceeded ? '#f87171' : '#4ade80'
                            }}
                        />
                    </div>
                    <span>{limits.storage.current} GB / {limits.storage.max} GB</span>
                </div>
            </div>

            <div className="features-section">
                <h3>Features</h3>
                <div className="features-list">
                    {tenant.settings.features.map(feature => (
                        <span key={feature} className="feature-badge">
                            ✓ {feature.replace(/-/g, ' ')}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

const styles = `
.tenant-dashboard {
  padding: 2rem;
}

.tenant-info {
  display: flex;
  gap: 2rem;
  margin: 1rem 0 2rem;
}

.info-item {
  display: flex;
  gap: 0.5rem;
}

.status-active {
  color: #4ade80;
}

.status-trial {
  color: #fbbf24;
}

.status-suspended {
  color: #f87171;
}

.usage-section {
  margin-bottom: 2rem;
}

.usage-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.usage-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.usage-fill {
  height: 100%;
  transition: width 0.3s;
}

.features-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.feature-badge {
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 6px;
  font-size: 0.85rem;
  text-transform: capitalize;
}
`;
