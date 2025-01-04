import * as vscode from 'vscode';

/**
 * Manages VS Code event subscriptions and handlers
 */
export class EventListenerService implements vscode.Disposable {
    private readonly _context: vscode.ExtensionContext;
    private readonly _disposables: vscode.Disposable[] = [];

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    /**
     * Initializes event listeners
     */
    public async initializeListeners(): Promise<void> {
        // Subscribe to workspace events
        this.subscribeToWorkspaceEvents();
        
        // Subscribe to window events
        this.subscribeToWindowEvents();
    }

    /**
     * Subscribes to workspace-related events
     */
    private subscribeToWorkspaceEvents(): void {
        // Watch for file changes
        const fileWatcher = vscode.workspace.onDidSaveTextDocument((document) => {
            // Handle file save events
            console.log(`File saved: ${document.fileName}`);
        });

        this._disposables.push(fileWatcher);
        this._context.subscriptions.push(fileWatcher);
    }

    /**
     * Subscribes to window-related events
     */
    private subscribeToWindowEvents(): void {
        // Watch for active editor changes
        const activeEditorWatcher = vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                console.log(`Active editor changed: ${editor.document.fileName}`);
            }
        });

        this._disposables.push(activeEditorWatcher);
        this._context.subscriptions.push(activeEditorWatcher);
    }

    /**
     * Disposes of event subscriptions
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