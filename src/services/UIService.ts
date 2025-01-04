import * as vscode from 'vscode';

/**
 * Manages VS Code UI components and notifications
 */
export class UIService implements vscode.Disposable {
    private readonly _context: vscode.ExtensionContext;
    private readonly _disposables: vscode.Disposable[] = [];
    private _statusBarItem: vscode.StatusBarItem;
    private _activeProgress: vscode.Progress<{ message?: string; increment?: number }> | undefined;

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
     * Shows an information message with optional actions
     * @param message - Message to show
     * @param items - Action items to show
     */
    public async showInfo(message: string, ...items: string[]): Promise<string | undefined> {
        return await vscode.window.showInformationMessage(message, ...items);
    }

    /**
     * Shows an error message with optional actions
     * @param message - Error message to show
     * @param items - Action items to show
     */
    public async showError(message: string, ...items: string[]): Promise<string | undefined> {
        return await vscode.window.showErrorMessage(message, ...items);
    }

    /**
     * Shows a warning message with optional actions
     * @param message - Warning message to show
     * @param items - Action items to show
     */
    public async showWarning(message: string, ...items: string[]): Promise<string | undefined> {
        return await vscode.window.showWarningMessage(message, ...items);
    }

    /**
     * Shows a progress indicator with a message
     * @param title - Title of the progress
     * @param task - Task function that reports progress
     */
    public async withProgress<T>(
        title: string,
        task: (
            progress: vscode.Progress<{ message?: string; increment?: number }>,
            token: vscode.CancellationToken
        ) => Thenable<T>
    ): Promise<T> {
        return await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title,
                cancellable: true
            },
            async (progress, token) => {
                this._activeProgress = progress;
                try {
                    return await task(progress, token);
                } finally {
                    this._activeProgress = undefined;
                }
            }
        );
    }

    /**
     * Shows a toast notification
     * @param message - Message to show
     * @param duration - Duration in milliseconds
     */
    public async showToast(message: string, duration: number = 3000): Promise<void> {
        const toast = await this.showInfo(message);
        setTimeout(() => {
            if (toast) {
                // Clear the notification after duration
                vscode.commands.executeCommand('notifications.clearAll');
            }
        }, duration);
    }

    /**
     * Updates progress if there's an active progress indicator
     * @param message - Progress message
     * @param increment - Progress increment
     */
    public updateProgress(message: string, increment?: number): void {
        if (this._activeProgress) {
            this._activeProgress.report({ message, increment });
        }
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