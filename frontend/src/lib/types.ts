// frontend/src/lib/types.ts
export type Provider = 'openai' | 'huggingface';
export type Model = 'gpt-4-vision-preview' | 'gpt-4' | 'gpt-3.5-turbo' | string;

export interface ModelConfig {
    provider: Provider;
    model: Model;
    apiKey: string;
    costPerToken: number;
    maxTokens: number;
    temperature: number;
}

export interface ProcessedItem {
    id: number;
    image: string;
    filename: string;
    caption: string;
    timestamp: string;
    status: 'success' | 'error' | 'pending';
}

export interface ExamplePair {
    id: number;
    image: string;
    filename: string;
    caption: string;
}

export interface PromptTemplate {
    id: string;
    name: string;
    content: string;
    isDefault?: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProcessingConfig {
    batchSize: number;
    errorHandling: 'continue' | 'stop';
    concurrentProcessing: number;
}

export interface AppState {
    currentView: 'generator' | 'batch';
    modelConfig: ModelConfig;
    processingConfig: ProcessingConfig;
    examples: ExamplePair[];
    processedItems: ProcessedItem[];
    isProcessing: boolean;
    templates: PromptTemplate[];
    activeTemplate: PromptTemplate;
}