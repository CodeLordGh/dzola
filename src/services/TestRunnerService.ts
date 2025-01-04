import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigurationService, ExtensionConfig } from './ConfigurationService';

export interface TestFramework {
    name: 'jest' | 'mocha';
    configFile: string;
    testCommand: string;
}

export interface TestRunOptions {
    testFile?: string;
    testName?: string;
    watch?: boolean;
}

export interface TestResult {
    success: boolean;
    failedTests: string[];
    passedTests: string[];
    coverage?: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
    };
    duration: number;
}

export class TestRunnerService {
    private readonly configService: ConfigurationService;
    private currentFramework: TestFramework | undefined;
    private terminal: vscode.Terminal | undefined;

    constructor(configService: ConfigurationService) {
        this.configService = configService;
        this.detectFramework();
    }

    private async detectFramework(): Promise<void> {
        const config = this.configService.getFullConfig();
        const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        
        if (!workspacePath) {
            throw new Error('No workspace folder found');
        }

        // Check for framework configuration files
        const frameworks: TestFramework[] = [
            {
                name: 'jest',
                configFile: 'jest.config.js',
                testCommand: 'jest'
            },
            {
                name: 'mocha',
                configFile: '.mocharc.js',
                testCommand: 'mocha'
            }
        ];

        for (const framework of frameworks) {
            const configPath = path.join(workspacePath, framework.configFile);
            try {
                await vscode.workspace.fs.stat(vscode.Uri.file(configPath));
                this.currentFramework = framework;
                break;
            } catch {
                continue;
            }
        }

        // If no framework detected, use the one from settings
        if (!this.currentFramework) {
            this.currentFramework = {
                name: config.testFramework.type,
                configFile: config.testFramework.type === 'jest' ? 'jest.config.js' : '.mocharc.js',
                testCommand: config.testFramework.type
            };
        }
    }

    public async runTests(options: TestRunOptions = {}): Promise<TestResult> {
        if (!this.currentFramework) {
            await this.detectFramework();
        }

        const command = this.buildTestCommand(options);
        return await this.executeTests(command);
    }

    private buildTestCommand(options: TestRunOptions): string {
        const framework = this.currentFramework!;
        let command = `npx ${framework.testCommand}`;

        if (options.testFile) {
            command += ` ${options.testFile}`;
        }

        if (options.testName) {
            command += framework.name === 'jest' 
                ? ` -t "${options.testName}"`
                : ` --grep "${options.testName}"`;
        }

        if (options.watch) {
            command += framework.name === 'jest' ? ' --watch' : ' --watch';
        }

        // Add coverage reporting
        command += framework.name === 'jest' 
            ? ' --coverage --json --outputFile=coverage/test-results.json'
            : ' --reporter json --reporter-option output=coverage/test-results.json';

        return command;
    }

    private async executeTests(command: string): Promise<TestResult> {
        return new Promise((resolve, reject) => {
            if (!this.terminal) {
                this.terminal = vscode.window.createTerminal('Test Runner');
            }

            const startTime = Date.now();
            this.terminal.show();
            this.terminal.sendText(command);

            // TODO: Implement proper test result parsing from the output file
            // For now, return a mock result
            setTimeout(() => {
                resolve({
                    success: true,
                    failedTests: [],
                    passedTests: ['example.test.ts'],
                    coverage: {
                        statements: 85,
                        branches: 70,
                        functions: 90,
                        lines: 85
                    },
                    duration: Date.now() - startTime
                });
            }, 1000);
        });
    }

    public getFramework(): TestFramework | undefined {
        return this.currentFramework;
    }

    public async checkTestFileExists(filePath: string): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
            return true;
        } catch {
            return false;
        }
    }

    public dispose(): void {
        if (this.terminal) {
            this.terminal.dispose();
        }
    }
} 