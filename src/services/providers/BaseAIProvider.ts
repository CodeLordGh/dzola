import { AIProvider, AIRequestOptions, AIResponse } from '../AIService';

export abstract class BaseAIProvider implements AIProvider {
    protected readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    abstract generateTests(options: AIRequestOptions): Promise<AIResponse>;
    abstract validateConfig(): Promise<boolean>;

    protected buildTestGenerationPrompt(options: AIRequestOptions): string {
        return `
Please generate unit tests for the following code:

SOURCE CODE:
\`\`\`
${options.sourceCode}
\`\`\`

${options.existingTests ? `
EXISTING TESTS:
\`\`\`
${options.existingTests}
\`\`\`
` : ''}

Requirements:
1. Use best practices for unit testing
2. Ensure comprehensive test coverage
3. Include edge cases and error scenarios
4. Follow the existing test patterns if present
5. Add necessary imports and setup code
6. Include descriptive test names and comments

${options.prompt}
`;
    }

    protected parseTestResponse(response: string): AIResponse {
        const importRegex = /^import\s+.*?;?\s*$/gm;
        const imports = response.match(importRegex) || [];
        const testCode = response.replace(importRegex, '').trim();

        return {
            testCode,
            suggestedImports: imports.map(imp => imp.trim()),
            explanation: this.extractComments(response),
            coverage: {
                estimatedCoverage: this.estimateCoverage(response)
            }
        };
    }

    private extractComments(code: string): string {
        const comments: string[] = [];
        const commentRegex = /\/\*[\s\S]*?\*\/|\/\/.*/g;
        let match;

        while ((match = commentRegex.exec(code)) !== null) {
            comments.push(match[0].replace(/^\/\*|\*\/|\/\//g, '').trim());
        }

        return comments.join('\n');
    }

    private estimateCoverage(testCode: string): number {
        // Simple heuristic based on test patterns
        const patterns = [
            /describe\(/g,
            /it\(/g,
            /test\(/g,
            /expect\(/g,
            /assert\./g,
            /should\./g
        ];

        const totalMatches = patterns.reduce((sum, pattern) => {
            const matches = testCode.match(pattern);
            return sum + (matches ? matches.length : 0);
        }, 0);

        // Normalize to a percentage (max 100)
        return Math.min(100, totalMatches * 5);
    }
} 