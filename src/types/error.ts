export enum ErrorType {
    Network = 'NETWORK',
    AIService = 'AI_SERVICE',
    TestFramework = 'TEST_FRAMEWORK',
    VSCodeAPI = 'VSCODE_API'
}

export interface ErrorDetails {
    type: ErrorType;
    message: string;
    stack?: string;
    context: string;
    timestamp: string;
}

export interface RecoveryStrategy {
    execute: () => Promise<void>;
}