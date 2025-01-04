import * as vscode from 'vscode';

export enum SecretKey {
    OPENAI_API_KEY = 'ai.openai.apiKey',
    OPENAI_ORG_ID = 'ai.openai.organizationId',
    AZURE_API_KEY = 'ai.azure.apiKey',
    GOOGLE_API_KEY = 'ai.google.apiKey',
    CLAUDE_API_KEY = 'ai.claude.apiKey',
    CLAUDE_ORG_ID = 'ai.claude.organizationId'
}

export class SecureStorageService {
    private storage: vscode.SecretStorage;

    constructor(context: vscode.ExtensionContext) {
        this.storage = context.secrets;
    }

    public async storeSecret(key: string, value: string): Promise<void> {
        await this.storage.store(key, value);
    }

    public async getSecret(key: string): Promise<string | undefined> {
        return await this.storage.get(key);
    }

    public async deleteSecret(key: string): Promise<void> {
        await this.storage.delete(key);
    }

    public async clearAllSecrets(): Promise<void> {
        // Get all known keys and delete them
        const keys = Object.values(SecretKey);
        await Promise.all(keys.map(key => this.deleteSecret(key)));
    }

    public async checkSecretExists(key: string): Promise<boolean> {
        const value = await this.getSecret(key);
        return value !== undefined;
    }

    public async getProviderApiKey(provider: string): Promise<string | undefined> {
        switch (provider) {
            case 'openai':
                return this.getSecret(SecretKey.OPENAI_API_KEY);
            case 'azure':
                return this.getSecret(SecretKey.AZURE_API_KEY);
            case 'google':
                return this.getSecret(SecretKey.GOOGLE_API_KEY);
            case 'claude':
                return this.getSecret(SecretKey.CLAUDE_API_KEY);
            default:
                return undefined;
        }
    }
} 