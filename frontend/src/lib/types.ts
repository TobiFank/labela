// frontend/src/lib/types.ts


import {encode} from "gpt-tokenizer";

export type Provider = 'openai' | 'huggingface';
export type Model = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-4v' | string;

export interface ModelConfig {
    provider: Provider;
    model: Model;
    apiKey: string;
    costPerToken: number;
    temperature: number;
}

export interface TokenCount {
    systemPromptTokens: number;
    templateTokens: number;
    exampleTokens: number;
    imageTokens: number;
    totalTokens: number;
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
    isDefault: boolean;
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

export function countTokens(template: PromptTemplate, examples: ExamplePair[]): TokenCount {
    // System prompt is constant
    const systemPrompt = "You are a highly accurate image captioning assistant. Your task is to generate detailed, accurate captions for images based on what you can directly observe. Follow the user's instructions carefully for the desired captioning style and format.";
    const systemPromptTokens = encode(systemPrompt).length;

    // Template tokens (only counted once)
    const templateTokens = encode(template.content).length;

    // Each image costs approximately 85 tokens (according to OpenAI documentation)
    const imageTokensPerExample = 85;
    const totalImages = examples.length + 1; // examples + test image
    const imageTokens = imageTokensPerExample * totalImages;

    // Example captions
    const exampleTokens = examples.reduce((sum, example) => {
        return sum + encode(example.caption).length;
    }, 0);

    return {
        systemPromptTokens,
        templateTokens,
        exampleTokens,
        imageTokens,
        totalTokens: systemPromptTokens + templateTokens + exampleTokens + imageTokens
    };
}

export function calculateCost(tokenCount: TokenCount, costPerToken: number): number {
    return (tokenCount.totalTokens * costPerToken) / 1000; // Cost per 1K tokens
}