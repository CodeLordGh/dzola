import * as vscode from 'vscode';

/**
 * Manages command registration and execution
 */
export class CommandRegistry implements vscode.Disposable {
    private readonly _context: vscode.ExtensionContext;
    private readonly _disposables: vscode.Disposable[] = [];

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    /**
     * Registers all extension commands
     */
    public async registerCommands(): Promise<void> {
        // Register core commands
        this.registerCommand('test-generator.generateTest', () => {
            vscode.window.showInformationMessage('Generating test...');
        });

        this.registerCommand('test-generator.refreshTests', () => {
            vscode.window.showInformationMessage('Refreshing tests...');
        });
    }

    /**
     * Registers a single command
     * @param command - Command identifier
     * @param callback - Command implementation
     */
    private registerCommand(command: string, callback: (...args: any[]) => any): void {
        const disposable = vscode.commands.registerCommand(command, callback);
        this._disposables.push(disposable);
        this._context.subscriptions.push(disposable);
    }

    /**
     * Disposes of registered commands
     */
    public dispose(): void {
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
} 