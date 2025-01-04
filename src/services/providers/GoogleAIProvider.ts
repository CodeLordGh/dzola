import { VertexAI } from '@google-cloud/vertexai';
import { AIRequestOptions, AIResponse } from '../AIService';
import { BaseAIProvider } from './BaseAIProvider';

export class GoogleAIProvider extends BaseAIProvider {
    private readonly projectId: string;
    private readonly location: string;
    private readonly model: string;
    private vertexAI: VertexAI;

    constructor(apiKey: string, projectId: string, location: string, model: string) {
        super(apiKey);
        this.projectId = projectId;
        this.location = location;
        this.model = model;

        // Initialize Vertex AI with credentials
        this.vertexAI = new VertexAI({
            project: this.projectId,
            location: this.location,
            apiEndpoint: `${this.location}-aiplatform.googleapis.com`
        });
    }

    public async generateTests(options: AIRequestOptions): Promise<AIResponse> {
        const prompt = this.buildTestGenerationPrompt(options);

        try {
            const model = this.vertexAI.preview.getGenerativeModel({
                model: this.model,
                generation_config: {
                    max_output_tokens: options.maxTokens,
                    temperature: options.temperature
                }
            });

            const request = {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    }
                ]
            };

            const response = await model.generateContent(request);
            const result = await response.response;
            
            if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('No test code generated');
            }

            return this.parseTestResponse(result.candidates[0].content.parts[0].text);
        } catch (error) {
            console.error('Google AI API Error:', error);
            throw new Error(`Failed to generate tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async validateConfig(): Promise<boolean> {
        try {
            // Try to list models as a simple API validation
            const model = this.vertexAI.preview.getGenerativeModel({
                model: this.model
            });
            
            // Make a simple request to validate configuration
            const request = {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: 'Test connection' }]
                    }
                ]
            };
            
            await model.generateContent(request);
            return true;
        } catch (error) {
            console.error('Google AI configuration validation failed:', error);
            return false;
        }
    }
} 