import * as vscode from 'vscode';
import { ExtensionCore } from './core/ExtensionCore';
import { CommandRegistry } from './commands/CommandRegistry';
import { EventListenerService } from './services/EventListenerService';
import { FileWatcherService } from './services/FileWatcherService';
import { UIService } from './services/UIService';

/**
 * Activates the extension
 * @param context - The extension context provided by VS Code
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // Initialize core services
    const extensionCore = new ExtensionCore(context);
    const commandRegistry = new CommandRegistry(context);
    const eventListener = new EventListenerService(context);
    const fileWatcher = new FileWatcherService(context);
    const uiService = new UIService(context);

    // Initialize services
    fileWatcher.initialize();
    uiService.initialize();

    // Register base commands
    await commandRegistry.registerCommands();

    // Initialize event listeners
    await eventListener.initializeListeners();

    // Push disposables to context
    context.subscriptions.push(
        extensionCore,
        commandRegistry,
        eventListener,
        fileWatcher,
        uiService
    );

    // Show activation message using UI service
    uiService.showInfo('Test Generation Extension is now active!');
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
    // Log deactivation for debugging purposes
    console.log('Test Generation Extension is being deactivated');
    
    // Note: Cleanup of disposables is automatically handled by VS Code
    // through the context.subscriptions we set up in activate()
} 