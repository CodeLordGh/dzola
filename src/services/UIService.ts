import * as vscode from 'vscode';

/**
 * Manages VS Code UI components
 */
export class UIService implements vscode.Disposable {
    private readonly _context: vscode.ExtensionContext;
    private readonly _disposables: vscode.Disposable[] = [];
    private _statusBarItem: vscode.StatusBarItem;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        this._statusBarItem = this.createStatusBarItem();
    }

    /**
     * Initializes UI components
     */
    public initialize(): void {
        this.showStatusBarItem();
    }

    /**
     * Creates the status bar item
     */
    private createStatusBarItem(): vscode.StatusBarItem {
        const statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        
        statusBarItem.text = "$(beaker) Tests";
        statusBarItem.tooltip = "Generate or Run Tests";
        statusBarItem.command = 'test-generator.generateTest';
        
        this._disposables.push(statusBarItem);
        return statusBarItem;
    }

    /**
     * Shows the status bar item
     */
    private showStatusBarItem(): void {
        this._statusBarItem.show();
    }

    /**
     * Updates the status bar item text
     * @param text - New text to display
     */
    public updateStatusBarText(text: string): void {
        this._statusBarItem.text = text;
    }

    /**
     * Shows an information message
     * @param message - Message to show
     */
    public showInfo(message: string): void {
        vscode.window.showInformationMessage(message);
    }

    /**
     * Shows an error message
     * @param message - Error message to show
     */
    public showError(message: string): void {
        vscode.window.showErrorMessage(message);
    }

    /**
     * Shows a warning message
     * @param message - Warning message to show
     */
    public showWarning(message: string): void {
        vscode.window.showWarningMessage(message);
    }

    /**
     * Disposes of UI components
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