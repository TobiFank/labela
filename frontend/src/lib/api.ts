// frontend/src/lib/api.ts
import {ExamplePair, ProcessedItem, PromptTemplate} from './types';

class ApiClient {
    private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    async generateCaption(image: File, examples: ExamplePair[]): Promise<string> {
        const formData = new FormData();
        formData.append('image', image);
        formData.append('examples', JSON.stringify(examples));

        const response = await fetch(`${this.baseUrl}/generate-caption`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to generate caption');
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

    async createPromptTemplate(template: Omit<PromptTemplate, 'id'>): Promise<PromptTemplate> {
        const response = await fetch(`${this.baseUrl}/prompt-templates`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(template),
        });
        if (!response.ok) throw new Error('Failed to create template');
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
}

export const api = new ApiClient();