import * as vscode from 'vscode';

export class InteractionService implements vscode.Disposable {
    private readonly _context: vscode.ExtensionContext;
    private readonly _disposables: vscode.Disposable[] = [];

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        this.registerCommands();
        this.setupContextMenus();
    }

    private registerCommands(): void {
        this._disposables.push(
            vscode.commands.registerCommand('test-generator.generateTest', () => {
                this.handleGenerateTest();
            }),
            vscode.commands.registerCommand('test-generator.rerunTest', (testId: string) => {
                this.handleRerunTest(testId);
            }),
            vscode.commands.registerCommand('test-generator.viewTestResults', () => {
                this.handleViewTestResults();
            }),
            vscode.commands.registerCommand('test-generator.configureSettings', () => {
                this.handleConfigureSettings();
            })
        );
    }

    private setupContextMenus(): void {
        this._disposables.push(
            vscode.window.registerTreeDataProvider('testExplorer', {
                getTreeItem: () => {
                    return new vscode.TreeItem('Tests', vscode.TreeItemCollapsibleState.Collapsed);
                },
                getChildren: () => {
                    return Promise.resolve([]);
                }
            })
        );
    }

    private async handleGenerateTest(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Please open a file to generate tests for.');
            return;
        }

        // Trigger test generation workflow
        await vscode.commands.executeCommand('test-generator.internal.generateTest', editor.document.uri);
    }

    private async handleRerunTest(testId: string): Promise<void> {
        // Trigger test rerun workflow
        await vscode.commands.executeCommand('test-generator.internal.rerunTest', testId);
    }

    private handleViewTestResults(): void {
        // Open test results view
        vscode.commands.executeCommand('test-generator.internal.showResults');
    }

    private handleConfigureSettings(): void {
        // Open settings UI
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:test-generator');
    }

    public dispose(): void {
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
} 