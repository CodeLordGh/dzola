import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CacheService } from './CacheService';
import { TestResult } from './TestRunnerService';

export interface TestHistory {
    timestamp: number;
    result: TestResult;
    testFile: string;
}

export class TestResultsService {
    private readonly cacheService: CacheService;
    private readonly historyLimit: number = 100;
    private readonly context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext, cacheService: CacheService) {
        this.context = context;
        this.cacheService = cacheService;
    }

    public async parseTestResults(testFile: string): Promise<TestResult | undefined> {
        const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspacePath) {
            return undefined;
        }

        const resultPath = path.join(workspacePath, 'coverage', 'test-results.json');
        try {
            const content = await fs.promises.readFile(resultPath, 'utf-8');
            const results = JSON.parse(content);
            
            // Parse Jest format
            if (results.testResults) {
                return this.parseJestResults(results);
            }
            // Parse Mocha format
            else if (results.stats) {
                return this.parseMochaResults(results);
            }
            
            return undefined;
        } catch (error) {
            console.error('Failed to parse test results:', error);
            return undefined;
        }
    }

    private parseJestResults(results: any): TestResult {
        const failedTests: string[] = [];
        const passedTests: string[] = [];

        results.testResults.forEach((suite: any) => {
            suite.assertionResults.forEach((test: any) => {
                const testName = `${suite.name}:${test.title}`;
                if (test.status === 'failed') {
                    failedTests.push(testName);
                } else if (test.status === 'passed') {
                    passedTests.push(testName);
                }
            });
        });

        return {
            success: results.success,
            failedTests,
            passedTests,
            coverage: results.coverageMap ? {
                statements: results.coverageMap.statements.pct,
                branches: results.coverageMap.branches.pct,
                functions: results.coverageMap.functions.pct,
                lines: results.coverageMap.lines.pct
            } : undefined,
            duration: results.testResults.reduce((acc: number, result: any) => acc + result.duration, 0)
        };
    }

    private parseMochaResults(results: any): TestResult {
        return {
            success: results.stats.failures === 0,
            failedTests: results.failures.map((f: any) => f.fullTitle),
            passedTests: results.passes.map((p: any) => p.fullTitle),
            coverage: results.coverage ? {
                statements: results.coverage.statements.pct,
                branches: results.coverage.branches.pct,
                functions: results.coverage.functions.pct,
                lines: results.coverage.lines.pct
            } : undefined,
            duration: results.stats.duration
        };
    }

    public async addToHistory(testFile: string, result: TestResult): Promise<void> {
        const historyKey = `test-history-${testFile}`;
        const history = await this.getHistory(testFile);
        
        history.unshift({
            timestamp: Date.now(),
            result,
            testFile
        });

        // Keep only the last N entries
        if (history.length > this.historyLimit) {
            history.length = this.historyLimit;
        }

        this.cacheService.set(historyKey, history);
        await this.persistHistory(testFile, history);
    }

    public async getHistory(testFile: string): Promise<TestHistory[]> {
        const historyKey = `test-history-${testFile}`;
        const cachedHistory = this.cacheService.get<TestHistory[]>(historyKey);
        
        if (cachedHistory) {
            return cachedHistory;
        }

        const persistedHistory = await this.loadPersistedHistory(testFile);
        if (persistedHistory) {
            this.cacheService.set(historyKey, persistedHistory);
            return persistedHistory;
        }

        return [];
    }

    private async persistHistory(testFile: string, history: TestHistory[]): Promise<void> {
        const historyPath = this.getHistoryPath(testFile);
        await fs.promises.writeFile(historyPath, JSON.stringify(history, null, 2));
    }

    private async loadPersistedHistory(testFile: string): Promise<TestHistory[] | undefined> {
        try {
            const historyPath = this.getHistoryPath(testFile);
            const content = await fs.promises.readFile(historyPath, 'utf-8');
            return JSON.parse(content);
        } catch {
            return undefined;
        }
    }

    private getHistoryPath(testFile: string): string {
        const historyDir = path.join(this.context.globalStorageUri.fsPath, 'test-history');
        if (!fs.existsSync(historyDir)) {
            fs.mkdirSync(historyDir, { recursive: true });
        }
        return path.join(historyDir, `${path.basename(testFile)}.history.json`);
    }
} 