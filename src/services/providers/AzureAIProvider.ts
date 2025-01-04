import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { AIRequestOptions, AIResponse } from '../AIService';
import { BaseAIProvider } from './BaseAIProvider';

export class AzureAIProvider extends BaseAIProvider {
    private readonly client: OpenAIClient;
    private readonly deploymentName: string;

    constructor(apiKey: string, endpoint: string, deploymentName: string) {
        super(apiKey);
        this.deploymentName = deploymentName;
        this.client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
    }

    public async generateTests(options: AIRequestOptions): Promise<AIResponse> {
        const prompt = this.buildTestGenerationPrompt(options);

        try {
            const response = await this.client.getChatCompletions(
                this.deploymentName,
                [
                    {
                        role: 'system',
                        content: 'You are a senior software engineer specializing in test automation. Generate comprehensive unit tests following best practices and the specified test framework patterns.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                {
                    maxTokens: options.maxTokens,
                    temperature: options.temperature
                }
            );

            const testCode = response.choices[0]?.message?.content;
            if (!testCode) {
                throw new Error('No test code generated');
            }

            return this.parseTestResponse(testCode);
        } catch (error) {
            console.error('Azure OpenAI API Error:', error);
            throw new Error(`Failed to generate tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async validateConfig(): Promise<boolean> {
        try {
            // Make a simple request to validate the configuration
            await this.client.getChatCompletions(
                this.deploymentName,
                [{ role: 'user', content: 'Test connection' }],
                { maxTokens: 1 }
            );
            return true;
        } catch (error) {
            console.error('Azure OpenAI configuration validation failed:', error);
            return false;
        }
    }
} 