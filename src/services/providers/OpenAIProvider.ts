import OpenAI from 'openai';
import { AIRequestOptions, AIResponse } from '../AIService';
import { BaseAIProvider } from './BaseAIProvider';

export class OpenAIProvider extends BaseAIProvider {
    private readonly client: OpenAI;
    private readonly model: string;
    private readonly organizationId?: string;

    constructor(apiKey: string, model: string, organizationId?: string) {
        super(apiKey);
        this.model = model;
        this.organizationId = organizationId;

        this.client = new OpenAI({
            apiKey: this.apiKey,
            organization: organizationId
        });
    }

    public async generateTests(options: AIRequestOptions): Promise<AIResponse> {
        const prompt = this.buildTestGenerationPrompt(options);

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a senior software engineer specializing in test automation. Generate comprehensive unit tests following best practices and the specified test framework patterns.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: options.maxTokens,
                temperature: options.temperature,
                n: 1
            });

            const testCode = response.choices[0]?.message?.content;
            if (!testCode) {
                throw new Error('No test code generated');
            }

            return this.parseTestResponse(testCode);
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error(`Failed to generate tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async validateConfig(): Promise<boolean> {
        try {
            // Try to list models as a simple API validation
            await this.client.models.list();
            return true;
        } catch (error) {
            console.error('OpenAI configuration validation failed:', error);
            return false;
        }
    }
} 