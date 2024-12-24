// frontend/src/lib/api.ts
import {ExamplePair, ModelConfig, ProcessedItem, ProcessingConfig, PromptTemplate} from './types';

class ApiClient {
    private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    async generateCaption(image: File): Promise<string> {
        const formData = new FormData();
        formData.append('image', image);

        try {
            const response = await fetch(`${this.baseUrl}/generate-caption`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to generate caption');
            }

            const data = await response.json();
            return data.caption;
        } catch (error) {
            console.error('Caption generation failed:', error);
            throw error;
        }
    }

    async startBatchProcessing(folder: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/batch-process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({folder}),
        });

        if (!response.ok) {
            throw new Error('Failed to start batch processing');
        }
    }

    async stopBatchProcessing(): Promise<void> {
        await fetch(`${this.baseUrl}/batch-process/stop`, {method: 'POST'});
    }

    async getProcessingStatus(): Promise<{
        progress: number;
        processedItems: ProcessedItem[];
        status: string;
    }> {
        const response = await fetch(`${this.baseUrl}/batch-process/status`);
        return response.json();
    }

    async uploadExamplePair(image: File, caption: string): Promise<ExamplePair> {
        const formData = new FormData();
        formData.append('image', image);
        formData.append('caption', caption);

        const response = await fetch(`${this.baseUrl}/examples`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload example pair');
        }

        return response.json();
    }

    async updateProcessedItemCaption(id: number, caption: string): Promise<ProcessedItem> {
        const response = await fetch(`${this.baseUrl}/processed-items/${id}/caption`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({caption}),
        });

        if (!response.ok) {
            throw new Error('Failed to update caption');
        }

        return response.json();
    }

    async removeExample(id: number): Promise<void> {
        const response = await fetch(`${this.baseUrl}/examples/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to remove example');
        }
    }

    async getPromptTemplates(): Promise<PromptTemplate[]> {
        const response = await fetch(`${this.baseUrl}/prompt-templates`);
        if (!response.ok) throw new Error('Failed to fetch templates');
        return response.json();
    }

    async createPromptTemplate(template: PromptTemplate): Promise<PromptTemplate> {
        const response = await fetch(`${this.baseUrl}/prompt-templates`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(template),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to create template');
        }
        return response.json();
    }

    async updatePromptTemplate(templateId: string, template: PromptTemplate): Promise<PromptTemplate> {
        const response = await fetch(`${this.baseUrl}/prompt-templates/${templateId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(template),
        });
        if (!response.ok) throw new Error('Failed to update template');
        return response.json();
    }

    async deletePromptTemplate(templateId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/prompt-templates/${templateId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete template');
    }

    private ensureCompleteImageUrl(imageUrl: string): string {
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }
        const baseUrl = 'http://localhost:8000';
        return `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    // Modify getExamples to ensure complete image URLs
    async getExamples(): Promise<ExamplePair[]> {
        const response = await fetch(`${this.baseUrl}/examples`);
        if (!response.ok) throw new Error('Failed to fetch examples');
        const examples = await response.json();
        // Ensure all image URLs are complete
        return examples.map((example: ExamplePair) => ({
            ...example,
            image: this.ensureCompleteImageUrl(example.image)
        }));
    }

    async getSettings(): Promise<ModelConfig & ProcessingConfig> {
        const response = await fetch(`${this.baseUrl}/settings`);
        if (!response.ok) {
            if (response.status === 404) {
                return {
                    provider: 'openai',
                    model: 'gpt-4o',
                    apiKey: '',
                    costPerToken: 0.01,
                    maxTokens: 1000,
                    temperature: 0.5,
                    batchSize: 50,
                    errorHandling: 'continue' as const,
                    concurrentProcessing: 2
                };
            }
            throw new Error('Failed to fetch settings');
        }
        const data = await response.json();

        // Transform snake_case to camelCase
        return {
            provider: data.provider,
            model: data.model,
            apiKey: data.api_key,
            costPerToken: data.cost_per_token,
            maxTokens: data.max_tokens,
            temperature: data.temperature,
            batchSize: data.batch_size,
            errorHandling: data.error_handling,
            concurrentProcessing: data.concurrent_processing
        };
    }

    async updateSettings(settings: Partial<ModelConfig & ProcessingConfig>) {
        // Transform camelCase to snake_case for backend
        const backendSettings = {
            provider: settings.provider,
            model: settings.model,
            api_key: settings.apiKey,
            cost_per_token: settings.costPerToken,
            max_tokens: settings.maxTokens,
            temperature: settings.temperature,
            batch_size: settings.batchSize,
            error_handling: settings.errorHandling,
            concurrent_processing: settings.concurrentProcessing
        };

        const response = await fetch(`${this.baseUrl}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendSettings),
        });

        if (!response.ok) {
            throw new Error('Failed to update settings');
        }

        // Transform response back to camelCase
        return this.getSettings();  // Reuse our transformation logic
    }
}

export const api = new ApiClient();