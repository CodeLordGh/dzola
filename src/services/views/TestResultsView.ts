import * as vscode from 'vscode';
import * as path from 'path';

export class TestResultsView {
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionPath: string;
    private _disposables: vscode.Disposable[] = [];

    constructor(context: vscode.ExtensionContext) {
        this._extensionPath = context.extensionPath;
        this._panel = this.createWebviewPanel();
        this.initialize();
    }

    private createWebviewPanel(): vscode.WebviewPanel {
        return vscode.window.createWebviewPanel(
            'testResults',
            'Test Results',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this._extensionPath, 'media'))
                ]
            }
        );
    }

    private initialize(): void {
        this._panel.webview.html = this.getWebviewContent();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            message => this.handleMessage(message),
            null,
            this._disposables
        );
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Test Results</title>
                    <style>
                        body { font-family: var(--vscode-font-family); }
                        .test-result { margin: 10px 0; padding: 10px; border-radius: 5px; }
                        .success { background: var(--vscode-testing-iconPassed); }
                        .failure { background: var(--vscode-testing-iconFailed); }
                    </style>
                </head>
                <body>
                    <div id="results"></div>
                </body>
            </html>`;
    }

    public updateResults(results: any): void {
        this._panel.webview.postMessage({ type: 'updateResults', results });
    }

    private handleMessage(message: any): void {
        switch (message.type) {
            case 'rerunTest':
                vscode.commands.executeCommand('test-generator.rerunTest', message.testId);
                break;
        }
    }

    private dispose(): void {
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            disposable?.dispose();
        }
    }
} 