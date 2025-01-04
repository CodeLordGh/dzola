import * as vscode from 'vscode';

export interface ExtensionConfig {
    testFramework: {
        type: 'jest' | 'mocha';
        autoRun: boolean;
        testPattern: string;
    };
    ai: {
        provider: 'openai' | 'azure' | 'google' | 'claude';
        maxTokens: number;
        temperature: number;
        model?: string;
        // Provider-specific settings
        openai?: {
            model: string;
        };
        azure?: {
            deploymentName: string;
            endpoint: string;
        };
        google?: {
            model: string;
            project: string;
            location: string;
        };
        claude?: {
            model: string;
            organizationId?: string;
        };
    };
    notifications: {
        showTestResults: boolean;
        showAIProgress: boolean;
    };
}

export class ConfigurationService {
    private static readonly EXTENSION_CONFIG_SECTION = 'testGeneration';
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration(ConfigurationService.EXTENSION_CONFIG_SECTION);
        this.watchConfigChanges();
    }

    private watchConfigChanges(): void {
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(ConfigurationService.EXTENSION_CONFIG_SECTION)) {
                this.config = vscode.workspace.getConfiguration(ConfigurationService.EXTENSION_CONFIG_SECTION);
                this.validateConfig();
            }
        });
    }

    private validateConfig(): void {
        try {
            const config = this.getFullConfig();
            // Validate required fields
            if (!config.testFramework?.type) {
                throw new Error('Test framework type is required');
            }
            if (!config.ai?.provider) {
                throw new Error('AI provider is required');
            }

            // Validate provider-specific requirements
            switch (config.ai.provider) {
                case 'azure':
                    if (!config.ai.azure?.endpoint) {
                        throw new Error('Azure endpoint is required');
                    }
                    if (!config.ai.azure?.deploymentName) {
                        throw new Error('Azure deployment name is required');
                    }
                    break;
                case 'google':
                    if (!config.ai.google?.project) {
                        throw new Error('Google project ID is required');
                    }
                    if (!config.ai.google?.location) {
                        throw new Error('Google location is required');
                    }
                    break;
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown configuration error';
            vscode.window.showErrorMessage(`Configuration error: ${errorMessage}`);
        }
    }

    public getFullConfig(): ExtensionConfig {
        return {
            testFramework: {
                type: this.config.get('testFramework.type', 'jest'),
                autoRun: this.config.get('testFramework.autoRun', false),
                testPattern: this.config.get('testFramework.testPattern', '**/*.test.{ts,js}')
            },
            ai: {
                provider: this.config.get('ai.provider', 'openai'),
                maxTokens: this.config.get('ai.maxTokens', 2048),
                temperature: this.config.get('ai.temperature', 0.7),
                model: this.config.get('ai.model'),
                openai: {
                    model: this.config.get('ai.openai.model', 'gpt-4')
                },
                azure: {
                    deploymentName: this.config.get('ai.azure.deploymentName', ''),
                    endpoint: this.config.get('ai.azure.endpoint', '')
                },
                google: {
                    model: this.config.get('ai.google.model', 'gemini-pro'),
                    project: this.config.get('ai.google.project', ''),
                    location: this.config.get('ai.google.location', 'us-central1')
                },
                claude: {
                    model: this.config.get('ai.claude.model', 'claude-2'),
                    organizationId: this.config.get('ai.claude.organizationId')
                }
            },
            notifications: {
                showTestResults: this.config.get('notifications.showTestResults', true),
                showAIProgress: this.config.get('notifications.showAIProgress', true)
            }
        };
    }

    public async updateConfig(section: string, value: any): Promise<void> {
        await this.config.update(section, value, vscode.ConfigurationTarget.Workspace);
    }
} 