// frontend/src/lib/api.ts
import {ExamplePair, ModelConfig, ProcessedItem, ProcessingConfig, PromptTemplate} from './types';

class ApiClient {
    private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    async generateCaption(image: File): Promise<string> {
        const formData = new FormData();
        formData.append('image', image);

        // We don't need to send the settings since the backend will use stored settings
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

    async getExamples(): Promise<ExamplePair[]> {
        const response = await fetch(`${this.baseUrl}/examples`);
        if (!response.ok) throw new Error('Failed to fetch examples');
        return response.json();
    }

    async getSettings(): Promise<ModelConfig & ProcessingConfig> {
        const response = await fetch(`${this.baseUrl}/settings`);
        console.log('Settings response:', response); // Add logging
        if (!response.ok) {
            if (response.status === 404) {
                // Return default settings if none exist
                return {
                    provider: 'openai',
                    model: 'gpt-4-vision-preview',
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
        console.log('Got settings:', data); // Add logging
        return data;
    }

    async updateSettings(settings: Partial<ModelConfig & ProcessingConfig>): Promise<ModelConfig & ProcessingConfig> {
        console.log('Updating settings with:', settings); // Add logging
        const response = await fetch(`${this.baseUrl}/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });

        if (!response.ok) {
            throw new Error('Failed to update settings');
        }
        const data = await response.json();
        console.log('Update response:', data); // Add logging
        return data;
    }
}

export const api = new ApiClient();