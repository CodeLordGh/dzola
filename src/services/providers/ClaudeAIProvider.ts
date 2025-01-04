import Anthropic from '@anthropic-ai/sdk';
import { AIRequestOptions, AIResponse } from '../AIService';
import { BaseAIProvider } from './BaseAIProvider';

export class ClaudeAIProvider extends BaseAIProvider {
    private readonly client: Anthropic;
    private readonly model: string;
    private readonly organizationId?: string;

    constructor(apiKey: string, model: string, organizationId?: string) {
        super(apiKey);
        this.model = model;
        this.organizationId = organizationId;

        this.client = new Anthropic({
            apiKey: this.apiKey,
            ...(organizationId && { organizationId })
        });
    }

    public async generateTests(options: AIRequestOptions): Promise<AIResponse> {
        const prompt = this.buildTestGenerationPrompt(options);

        try {
            const message = await this.client.beta.messages.create({
                model: this.model,
                max_tokens: options.maxTokens || 1024,
                system: 'You are a senior software engineer specializing in test automation. Generate comprehensive unit tests following best practices and the specified test framework patterns.',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: options.temperature || 0.7
            });

            if (!message.content[0].text) {
                throw new Error('No test code generated');
            }

            return this.parseTestResponse(message.content[0].text);
        } catch (error) {
            console.error('Claude AI API Error:', error);
            throw new Error(`Failed to generate tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async validateConfig(): Promise<boolean> {
        try {
            // Make a simple request to validate the configuration
            await this.client.beta.messages.create({
                model: this.model,
                max_tokens: 10,
                messages: [
                    {
                        role: 'user',
                        content: 'Test connection'
                    }
                ],
                temperature: 0.7
            });
            return true;
        } catch (error) {
            console.error('Claude AI configuration validation failed:', error);
            return false;
        }
    }
} 