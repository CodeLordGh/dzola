import * as vscode from 'vscode';
import { ConfigurationService } from './ConfigurationService';
import { SecureStorageService, SecretKey } from './SecureStorageService';

export interface AIRequestOptions {
    prompt: string;
    sourceCode: string;
    existingTests?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface AIResponse {
    testCode: string;
    explanation?: string;
    suggestedImports?: string[];
    coverage?: {
        estimatedCoverage: number;
        uncoveredPaths?: string[];
    };
}

export interface AIProvider {
    generateTests(options: AIRequestOptions): Promise<AIResponse>;
    validateConfig(): Promise<boolean>;
}

export class AIService {
    private readonly configService: ConfigurationService;
    private readonly secureStorage: SecureStorageService;
    private currentProvider: AIProvider | undefined;

    constructor(
        configService: ConfigurationService,
        secureStorage: SecureStorageService
    ) {
        this.configService = configService;
        this.secureStorage = secureStorage;
    }

    public async initialize(): Promise<void> {
        const config = this.configService.getFullConfig();
        await this.setupProvider(config.ai.provider);
    }

    private async setupProvider(providerType: string): Promise<void> {
        const config = this.configService.getFullConfig();
        const apiKey = await this.secureStorage.getProviderApiKey(providerType);

        if (!apiKey) {
            throw new Error(`API key not found for provider: ${providerType}`);
        }

        switch (providerType) {
            case 'openai':
                const { OpenAIProvider } = await import('./providers/OpenAIProvider.js');
                this.currentProvider = new OpenAIProvider(
                    apiKey,
                    config.ai.openai?.model || 'gpt-4',
                    await this.secureStorage.getSecret(SecretKey.OPENAI_ORG_ID)
                );
                break;

            case 'azure':
                const { AzureAIProvider } = await import('./providers/AzureAIProvider.js');
                this.currentProvider = new AzureAIProvider(
                    apiKey,
                    config.ai.azure?.endpoint || '',
                    config.ai.azure?.deploymentName || ''
                );
                break;

            case 'google':
                const { GoogleAIProvider } = await import('./providers/GoogleAIProvider.js');
                this.currentProvider = new GoogleAIProvider(
                    apiKey,
                    config.ai.google?.project || '',
                    config.ai.google?.location || 'us-central1',
                    config.ai.google?.model || 'gemini-pro'
                );
                break;

            case 'claude':
                const { ClaudeAIProvider } = await import('./providers/ClaudeAIProvider.js');
                this.currentProvider = new ClaudeAIProvider(
                    apiKey,
                    config.ai.claude?.model || 'claude-2',
                    await this.secureStorage.getSecret(SecretKey.CLAUDE_ORG_ID)
                );
                break;

            default:
                throw new Error(`Unsupported AI provider: ${providerType}`);
        }

        // Validate the provider configuration
        const isValid = await this.currentProvider.validateConfig();
        if (!isValid) {
            throw new Error(`Invalid configuration for provider: ${providerType}`);
        }
    }

    public async generateTests(options: AIRequestOptions): Promise<AIResponse> {
        if (!this.currentProvider) {
            await this.initialize();
        }

        const config = this.configService.getFullConfig();
        const enrichedOptions: AIRequestOptions = {
            ...options,
            maxTokens: options.maxTokens || config.ai.maxTokens,
            temperature: options.temperature || config.ai.temperature
        };

        try {
            return await this.currentProvider!.generateTests(enrichedOptions);
        } catch (error) {
            console.error('Error generating tests:', error);
            throw new Error(`Failed to generate tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async validateCurrentProvider(): Promise<boolean> {
        if (!this.currentProvider) {
            await this.initialize();
        }
        return this.currentProvider!.validateConfig();
    }

    public getCurrentProvider(): string {
        const config = this.configService.getFullConfig();
        return config.ai.provider;
    }
} 