/**
 * UPDATE #123: White-Label Solution
 * Customizable branding for enterprise clients
 */

interface BrandingConfig {
    clientId: string;
    companyName: string;
    logo: {
        primary: string;
        secondary?: string;
        favicon: string;
    };
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    typography: {
        fontFamily: string;
        headingFont?: string;
    };
    customDomain?: string;
    features: {
        showPoweredBy: boolean;
        customFooter?: string;
        customHeader?: string;
    };
}

class WhiteLabelManager {
    private configs: Map<string, BrandingConfig> = new Map();
    private currentConfig: BrandingConfig | null = null;

    /**
     * Create white-label configuration
     */
    createConfig(config: BrandingConfig): void {
        this.configs.set(config.clientId, config);
    }

    /**
     * Load configuration by client ID
     */
    loadConfig(clientId: string): BrandingConfig | null {
        const config = this.configs.get(clientId);
        if (config) {
            this.currentConfig = config;
            this.applyBranding(config);
        }
        return config || null;
    }

    /**
     * Load configuration by domain
     */
    loadConfigByDomain(domain: string): BrandingConfig | null {
        for (const config of this.configs.values()) {
            if (config.customDomain === domain) {
                this.currentConfig = config;
                this.applyBranding(config);
                return config;
            }
        }
        return null;
    }

    /**
     * Apply branding to page
     */
    private applyBranding(config: BrandingConfig): void {
        // Update CSS variables
        document.documentElement.style.setProperty('--color-primary', config.colors.primary);
        document.documentElement.style.setProperty('--color-secondary', config.colors.secondary);
        document.documentElement.style.setProperty('--color-accent', config.colors.accent);
        document.documentElement.style.setProperty('--color-background', config.colors.background);
        document.documentElement.style.setProperty('--color-text', config.colors.text);
        document.documentElement.style.setProperty('--font-family', config.typography.fontFamily);

        if (config.typography.headingFont) {
            document.documentElement.style.setProperty('--font-heading', config.typography.headingFont);
        }

        // Update favicon
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
            favicon.href = config.logo.favicon;
        }

        // Update title
        document.title = config.companyName;
    }

    /**
     * Get current configuration
     */
    getCurrentConfig(): BrandingConfig | null {
        return this.currentConfig;
    }

    /**
     * Generate branded CSS
     */
    generateCSS(config: BrandingConfig): string {
        return `
      :root {
        --color-primary: ${config.colors.primary};
        --color-secondary: ${config.colors.secondary};
        --color-accent: ${config.colors.accent};
        --color-background: ${config.colors.background};
        --color-text: ${config.colors.text};
        --font-family: ${config.typography.fontFamily};
        --font-heading: ${config.typography.headingFont || config.typography.fontFamily};
      }

      body {
        font-family: var(--font-family);
        background: var(--color-background);
        color: var(--color-text);
      }

      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-heading);
      }

      .btn-primary {
        background: var(--color-primary);
      }

      .btn-secondary {
        background: var(--color-secondary);
      }

      a {
        color: var(--color-accent);
      }
    `;
    }

    /**
     * Export configuration
     */
    exportConfig(clientId: string): BrandingConfig | null {
        return this.configs.get(clientId) || null;
    }
}

export const whiteLabelManager = new WhiteLabelManager();

// Example configurations
whiteLabelManager.createConfig({
    clientId: 'acme-corp',
    companyName: 'ACME Streaming',
    logo: {
        primary: '/branding/acme/logo.svg',
        favicon: '/branding/acme/favicon.ico'
    },
    colors: {
        primary: '#FF6B35',
        secondary: '#004E89',
        accent: '#F7931E',
        background: '#0A0A0A',
        text: '#FFFFFF'
    },
    typography: {
        fontFamily: 'Inter, sans-serif',
        headingFont: 'Poppins, sans-serif'
    },
    customDomain: 'streaming.acme.com',
    features: {
        showPoweredBy: false,
        customFooter: '© 2024 ACME Corporation. All rights reserved.'
    }
});

/**
 * White-label branding component
 */
import React, { useEffect, useState } from 'react';

export function WhiteLabelProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<BrandingConfig | null>(null);

    useEffect(() => {
        // Load config based on domain
        const domain = window.location.hostname;
        const loadedConfig = whiteLabelManager.loadConfigByDomain(domain);
        setConfig(loadedConfig);

        // If no custom domain, try to load from URL parameter
        if (!loadedConfig) {
            const params = new URLSearchParams(window.location.search);
            const clientId = params.get('client');
            if (clientId) {
                const paramConfig = whiteLabelManager.loadConfig(clientId);
                setConfig(paramConfig);
            }
        }
    }, []);

    return (
        <>
            {config && (
                <style dangerouslySetInnerHTML={{
                    __html: whiteLabelManager.generateCSS(config)
                }} />
            )}
            {children}
        </>
    );
}

/**
 * Branded header component
 */
export function BrandedHeader() {
    const config = whiteLabelManager.getCurrentConfig();

    if (!config) return null;

    return (
        <header className="branded-header">
            <img src={config.logo.primary} alt={config.companyName} className="brand-logo" />
            {config.features.customHeader && (
                <div dangerouslySetInnerHTML={{ __html: config.features.customHeader }} />
            )}
        </header>
    );
}

/**
 * Branded footer component
 */
export function BrandedFooter() {
    const config = whiteLabelManager.getCurrentConfig();

    if (!config) return null;

    return (
        <footer className="branded-footer">
            {config.features.customFooter && (
                <div dangerouslySetInnerHTML={{ __html: config.features.customFooter }} />
            )}
            {config.features.showPoweredBy && (
                <div className="powered-by">
                    Powered by MovieShows
                </div>
            )}
        </footer>
    );
}

const styles = `
.branded-header {
  padding: 1rem 2rem;
  background: var(--color-background);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.brand-logo {
  height: 40px;
}

.branded-footer {
  padding: 2rem;
  text-align: center;
  background: var(--color-background);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.powered-by {
  margin-top: 1rem;
  opacity: 0.5;
  font-size: 0.85rem;
}
`;
