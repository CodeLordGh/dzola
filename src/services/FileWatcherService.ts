import * as vscode from 'vscode';
import * as path from 'path';
import { minimatch } from 'minimatch';

/**
 * Service for monitoring file system changes
 */
export class FileWatcherService implements vscode.Disposable {
    private readonly _context: vscode.ExtensionContext;
    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _fileWatchers: Map<string, vscode.FileSystemWatcher> = new Map();

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    /**
     * Initializes file system watchers
     */
    public initialize(): void {
        // Watch for test files
        this.watchPattern('**/*.test.{ts,js}');
        this.watchPattern('**/*.spec.{ts,js}');

        // Watch for source files that might need tests
        this.watchPattern('**/*.{ts,js}', '**/*.{test,spec}.{ts,js}');
    }

    /**
     * Creates a file system watcher for a specific pattern
     * @param globPattern - Pattern to watch
     * @param excludePattern - Pattern to exclude
     */
    private watchPattern(globPattern: string, excludePattern?: string): void {
        const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(this.getWorkspaceRoot(), globPattern),
            false, // Don't ignore create events
            false, // Don't ignore change events
            false  // Don't ignore delete events
        );

        // Handle file creation
        watcher.onDidCreate((uri) => {
            if (this.shouldHandleFile(uri, excludePattern)) {
                this.handleFileCreated(uri);
            }
        });

        // Handle file changes
        watcher.onDidChange((uri) => {
            if (this.shouldHandleFile(uri, excludePattern)) {
                this.handleFileChanged(uri);
            }
        });

        // Handle file deletion
        watcher.onDidDelete((uri) => {
            if (this.shouldHandleFile(uri, excludePattern)) {
                this.handleFileDeleted(uri);
            }
        });

        this._fileWatchers.set(globPattern, watcher);
        this._disposables.push(watcher);
    }

    /**
     * Checks if a file should be handled based on exclude pattern
     */
    private shouldHandleFile(uri: vscode.Uri, excludePattern?: string): boolean {
        if (!excludePattern) {
            return true;
        }
        const relativePath = vscode.workspace.asRelativePath(uri);
        return !minimatch(relativePath, excludePattern);
    }

    /**
     * Gets the workspace root path
     */
    private getWorkspaceRoot(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder found');
        }
        return workspaceFolders[0].uri.fsPath;
    }

    /**
     * Handles file creation events
     */
    private handleFileCreated(uri: vscode.Uri): void {
        console.log(`File created: ${uri.fsPath}`);
        // Additional creation handling logic will be added in future phases
    }

    /**
     * Handles file change events
     */
    private handleFileChanged(uri: vscode.Uri): void {
        console.log(`File changed: ${uri.fsPath}`);
        // Additional change handling logic will be added in future phases
    }

    /**
     * Handles file deletion events
     */
    private handleFileDeleted(uri: vscode.Uri): void {
        console.log(`File deleted: ${uri.fsPath}`);
        // Additional deletion handling logic will be added in future phases
    }

    /**
     * Disposes of file watchers and resources
     */
    public dispose(): void {
        this._fileWatchers.clear();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
} 