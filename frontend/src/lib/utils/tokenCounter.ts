// frontend/src/lib/utils/tokenCounter.ts
import { encode } from 'gpt-tokenizer';
import { ExamplePair, PromptTemplate } from '../types';

export interface TokenCount {
    systemPromptTokens: number;
    templateTokens: number;
    exampleTokens: number;
    imageTokens: number;
    totalTokens: number;
}

export function getImageTokenCount(width: number, height: number): number {
    const maxDimension = Math.max(width, height);
    if (maxDimension <= 512) {
        return 85;  // Low resolution
    } else if (maxDimension <= 2048) {
        return 170;  // High resolution
    } else {
        return 340;  // Detail resolution
    }
}

export async function getImageDimensions(file: File): Promise<{ width: number, height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        img.src = URL.createObjectURL(file);
    });
}

export function countTokens(template: PromptTemplate, examples: ExamplePair[]): TokenCount {
    // System prompt is constant
    const systemPrompt = "You are a highly accurate image captioning assistant. Your task is to generate detailed, accurate captions for images based on what you can directly observe. Follow the user's instructions carefully for the desired captioning style and format.";
    const systemPromptTokens = encode(systemPrompt).length;

    // Template tokens (only counted once)
    const templateTokens = encode(template.content).length;

    // Example captions
    const exampleTokens = examples.reduce((sum, example) => {
        return sum + encode(example.caption).length;
    }, 0);

    // For now, estimate image tokens (we'll update this when we get actual dimensions)
    const imageTokens = examples.length * 170;  // Use high resolution as default for examples

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