import * as vscode from 'vscode';
import * as path from 'path';
import { TestRunnerService, TestResult } from './TestRunnerService';
import { TestResultsService } from './TestResultsService';

type TestItemType = 'file' | 'suite' | 'test';

export class TestExplorerService implements vscode.Disposable {
    private readonly testController: vscode.TestController;
    private readonly disposables: vscode.Disposable[] = [];
    private readonly testRunner: TestRunnerService;
    private readonly resultsService: TestResultsService;
    private readonly itemTypes = new Map<string, TestItemType>();

    constructor(
        testRunner: TestRunnerService,
        resultsService: TestResultsService
    ) {
        this.testRunner = testRunner;
        this.resultsService = resultsService;
        this.testController = vscode.tests.createTestController('testGeneration', 'Test Generation');
        
        this.disposables.push(
            this.testController,
            vscode.workspace.onDidCreateFiles(e => this.onFilesChanged(e.files)),
            vscode.workspace.onDidDeleteFiles(e => this.onFilesChanged(e.files)),
            vscode.workspace.onDidChangeTextDocument(e => this.onFileContentChanged(e.document))
        );

        this.testController.resolveHandler = async test => {
            await this.discoverTests(test);
        };

        this.testController.refreshHandler = async () => {
            await this.discoverTests();
        };

        this.testController.createRunProfile(
            'Run Tests',
            vscode.TestRunProfileKind.Run,
            (request, token) => this.runHandler(request, token),
            true
        );
    }

    private async discoverTests(test?: vscode.TestItem): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        const framework = this.testRunner.getFramework();
        if (!framework) {
            return;
        }

        if (test) {
            await this.discoverTestsInFile(test);
        } else {
            // Discover all tests in workspace
            const pattern = new vscode.RelativePattern(
                workspaceFolders[0],
                '**/*.{test,spec}.{ts,js}'
            );
            const files = await vscode.workspace.findFiles(pattern);

            for (const file of files) {
                const fileItem = this.getOrCreateFileTestItem(file);
                await this.discoverTestsInFile(fileItem);
            }
        }
    }

    private async discoverTestsInFile(fileItem: vscode.TestItem): Promise<void> {
        if (!fileItem.uri) {
            return;
        }

        try {
            const content = await vscode.workspace.fs.readFile(fileItem.uri);
            const text = Buffer.from(content).toString('utf-8');
            
            // Simple regex-based test discovery
            const testRegex = /(?:test|it)\s*\(\s*['"](.+?)['"]/g;
            const suiteRegex = /describe\s*\(\s*['"](.+?)['"]/g;

            let match;
            while ((match = suiteRegex.exec(text))) {
                const suite = this.testController.createTestItem(
                    `${fileItem.id}:${match[1]}`,
                    match[1],
                    fileItem.uri
                );
                this.itemTypes.set(suite.id, 'suite');
                fileItem.children.add(suite);
            }

            while ((match = testRegex.exec(text))) {
                const test = this.testController.createTestItem(
                    `${fileItem.id}:${match[1]}`,
                    match[1],
                    fileItem.uri
                );
                this.itemTypes.set(test.id, 'test');
                fileItem.children.add(test);
            }
        } catch (error) {
            console.error(`Error discovering tests in ${fileItem.uri.fsPath}:`, error);
        }
    }

    private getOrCreateFileTestItem(uri: vscode.Uri): vscode.TestItem {
        const fileId = uri.fsPath;
        const existing = this.testController.items.get(fileId);
        if (existing) {
            return existing;
        }

        const fileItem = this.testController.createTestItem(
            fileId,
            path.basename(uri.fsPath),
            uri
        );
        this.itemTypes.set(fileItem.id, 'file');
        this.testController.items.add(fileItem);
        return fileItem;
    }

    private async runHandler(
        request: vscode.TestRunRequest,
        token: vscode.CancellationToken
    ): Promise<void> {
        const run = this.testController.createTestRun(request);
        const queue: vscode.TestItem[] = [];

        if (request.include) {
            queue.push(...request.include);
        } else {
            // Run all tests
            this.testController.items.forEach(test => queue.push(test));
        }

        for (const test of queue) {
            if (token.isCancellationRequested) {
                break;
            }

            // Only run actual test items, not suites or files
            if (this.itemTypes.get(test.id) !== 'test') {
                continue;
            }

            try {
                run.started(test);
                const result = await this.testRunner.runTests({
                    testFile: test.uri?.fsPath,
                    testName: test.label
                });

                await this.updateTestResults(test, result, run);
            } catch (error) {
                run.errored(test, new vscode.TestMessage(`Test execution failed: ${error}`));
            }
        }

        run.end();
    }

    private async updateTestResults(
        test: vscode.TestItem,
        result: TestResult,
        run: vscode.TestRun
    ): Promise<void> {
        if (result.success) {
            run.passed(test, result.duration);
        } else {
            const messages = result.failedTests.map(
                failure => new vscode.TestMessage(`Test failed: ${failure}`)
            );
            run.failed(test, messages, result.duration);
        }

        if (test.uri) {
            await this.resultsService.addToHistory(test.uri.fsPath, result);
        }
    }

    private async onFilesChanged(files: readonly vscode.Uri[]): Promise<void> {
        for (const file of files) {
            if (this.isTestFile(file)) {
                await this.discoverTests();
                break;
            }
        }
    }

    private async onFileContentChanged(document: vscode.TextDocument): Promise<void> {
        if (this.isTestFile(document.uri)) {
            const fileItem = this.getOrCreateFileTestItem(document.uri);
            await this.discoverTests(fileItem);
        }
    }

    private isTestFile(uri: vscode.Uri): boolean {
        const filename = uri.fsPath.toLowerCase();
        return filename.endsWith('.test.ts') || 
               filename.endsWith('.test.js') ||
               filename.endsWith('.spec.ts') ||
               filename.endsWith('.spec.js');
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.itemTypes.clear();
    }
} 