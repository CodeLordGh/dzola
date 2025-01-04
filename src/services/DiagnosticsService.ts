import * as vscode from 'vscode';

export class DiagnosticsService {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('test-generation');
    }

    reportProblem(
        document: vscode.TextDocument,
        range: vscode.Range,
        message: string,
        severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Error
    ): void {
        const diagnostic = new vscode.Diagnostic(range, message, severity);
        
        const existingDiagnostics = this.diagnosticCollection.get(document.uri) || [];
        this.diagnosticCollection.set(document.uri, [...existingDiagnostics, diagnostic]);
    }

    reportTestFailure(
        document: vscode.TextDocument,
        line: number,
        message: string
    ): void {
        const range = new vscode.Range(
            new vscode.Position(line, 0),
            new vscode.Position(line, document.lineAt(line).text.length)
        );

        this.reportProblem(
            document,
            range,
            `Test Failure: ${message}`,
            vscode.DiagnosticSeverity.Error
        );
    }

    reportTestWarning(
        document: vscode.TextDocument,
        line: number,
        message: string
    ): void {
        const range = new vscode.Range(
            new vscode.Position(line, 0),
            new vscode.Position(line, document.lineAt(line).text.length)
        );

        this.reportProblem(
            document,
            range,
            `Test Warning: ${message}`,
            vscode.DiagnosticSeverity.Warning
        );
    }

    reportCodeCoverage(
        document: vscode.TextDocument,
        uncoveredLines: number[]
    ): void {
        const diagnostics: vscode.Diagnostic[] = uncoveredLines.map(line => {
            const range = new vscode.Range(
                new vscode.Position(line, 0),
                new vscode.Position(line, document.lineAt(line).text.length)
            );

            return new vscode.Diagnostic(
                range,
                'Line not covered by tests',
                vscode.DiagnosticSeverity.Information
            );
        });

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    clearDiagnostics(document: vscode.TextDocument): void {
        this.diagnosticCollection.delete(document.uri);
    }

    clearAllDiagnostics(): void {
        this.diagnosticCollection.clear();
    }

    dispose(): void {
        this.diagnosticCollection.dispose();
    }
} 