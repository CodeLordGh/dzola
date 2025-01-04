import * as vscode from 'vscode';
import { ErrorType, ErrorDetails, RecoveryStrategy } from '../types/error';

export class ErrorHandlingService {
    private static readonly MAX_RETRIES = 3;
    private static readonly INITIAL_BACKOFF = 1000; // 1 second

    constructor(
        private readonly logger: vscode.OutputChannel,
    ) {}

    async handleError(error: Error, context: string): Promise<void> {
        const errorType = this.classifyError(error);
        const errorDetails = this.analyzeError(error, context);
        
        await this.logError(errorDetails);
        
        if (this.isRecoverable(errorType)) {
            await this.attemptRecovery(errorDetails);
        } else {
            await this.handleFatalError(errorDetails);
        }
    }

    private classifyError(error: Error): ErrorType {
        if (error.message.includes('network') || error instanceof TypeError) {
            return ErrorType.Network;
        } else if (error.message.includes('AI') || error.message.includes('OpenAI')) {
            return ErrorType.AIService;
        } else if (error.message.includes('test') || error.message.includes('jest')) {
            return ErrorType.TestFramework;
        } else {
            return ErrorType.VSCodeAPI;
        }
    }

    private analyzeError(error: Error, context: string): ErrorDetails {
        return {
            type: this.classifyError(error),
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
        };
    }

    private async logError(errorDetails: ErrorDetails): Promise<void> {
        this.logger.appendLine(`[ERROR] ${errorDetails.timestamp}`);
        this.logger.appendLine(`Type: ${errorDetails.type}`);
        this.logger.appendLine(`Context: ${errorDetails.context}`);
        this.logger.appendLine(`Message: ${errorDetails.message}`);
        this.logger.appendLine(`Stack: ${errorDetails.stack}`);
        this.logger.appendLine('---');
    }

    private isRecoverable(errorType: ErrorType): boolean {
        return [ErrorType.Network, ErrorType.AIService].includes(errorType);
    }

    private async attemptRecovery(errorDetails: ErrorDetails): Promise<boolean> {
        let retries = 0;
        let backoff = ErrorHandlingService.INITIAL_BACKOFF;

        while (retries < ErrorHandlingService.MAX_RETRIES) {
            try {
                await this.executeRecoveryStrategy(errorDetails.type);
                await this.showSuccessNotification();
                return true;
            } catch (error) {
                retries++;
                if (retries === ErrorHandlingService.MAX_RETRIES) {
                    await this.handleFatalError(errorDetails);
                    return false;
                }
                await this.wait(backoff);
                backoff *= 2; // Exponential backoff
            }
        }
        return false;
    }

    private async executeRecoveryStrategy(errorType: ErrorType): Promise<void> {
        const strategy = this.getRecoveryStrategy(errorType);
        await strategy.execute();
    }

    private getRecoveryStrategy(errorType: ErrorType): RecoveryStrategy {
        switch (errorType) {
            case ErrorType.Network:
                return { execute: async () => { /* Implement network retry logic */ } };
            case ErrorType.AIService:
                return { execute: async () => { /* Implement AI service retry logic */ } };
            default:
                throw new Error('No recovery strategy available');
        }
    }

    private async handleFatalError(errorDetails: ErrorDetails): Promise<void> {
        const message = `A fatal error occurred: ${errorDetails.message}`;
        const action = 'View Details';
        
        const selection = await vscode.window.showErrorMessage(message, action);
        if (selection === action) {
            this.logger.show();
        }
    }

    private async showSuccessNotification(): Promise<void> {
        await vscode.window.showInformationMessage('Operation recovered successfully');
    }

    private wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
} 