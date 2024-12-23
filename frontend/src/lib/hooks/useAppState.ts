// frontend/src/lib/hooks/useAppState.ts
import {useCallback, useEffect, useState} from 'react';
import {AppState, ModelConfig, ProcessingConfig, PromptTemplate} from '../types';
import {api} from '../api';

const DEFAULT_MODEL_CONFIG: ModelConfig = {
    provider: 'openai',
    model: 'gpt-4-vision-preview',
    apiKey: '',
    costPerToken: 0.01,
    maxTokens: 1000,
    temperature: 0.5,
};

const DEFAULT_PROCESSING_CONFIG: ProcessingConfig = {
    batchSize: 50,
    errorHandling: 'continue',
    concurrentProcessing: 2,
};

const DEFAULT_PROMPT_TEMPLATE: PromptTemplate = {
    id: 'default',
    name: 'Default Template',
    content: 'Generate a caption for the image following these guidelines...',
    isDefault: true,
};

export function useAppState() {
    const [state, setState] = useState<AppState>({
        currentView: 'generator',
        modelConfig: DEFAULT_MODEL_CONFIG,
        processingConfig: DEFAULT_PROCESSING_CONFIG,
        examples: [],
        processedItems: [],
        isProcessing: false,
        templates: [DEFAULT_PROMPT_TEMPLATE],
        activeTemplate: DEFAULT_PROMPT_TEMPLATE,
    });

    useEffect(() => {
        api.getPromptTemplates().then(templates => {
            setState(prev => ({
                ...prev,
                templates,
                activeTemplate: templates[0] || DEFAULT_PROMPT_TEMPLATE
            }));
        });
    }, []);

    const createTemplate = useCallback(async (template: PromptTemplate) => {
        try {
            // Just send the template as is - it will have an empty string id for new templates
            const saved = await api.createPromptTemplate(template);
            setState(prev => ({
                ...prev,
                templates: [...prev.templates, saved],
                activeTemplate: saved  // Also set it as the active template
            }));
        } catch (error) {
            console.error('Failed to create template:', error);
            // You might want to handle this error in the UI
        }
    }, []);

    const updateTemplate = useCallback(async (template: PromptTemplate) => {
        try {
            const updated = await api.updatePromptTemplate(template.id, template);
            setState(prev => ({
                ...prev,
                templates: prev.templates.map(t =>
                    t.id === updated.id ? updated : t
                ),
                activeTemplate: prev.activeTemplate.id === updated.id ? updated : prev.activeTemplate
            }));
        } catch (error) {
            console.error('Failed to update template:', error);
            // Handle error appropriately
        }
    }, []);

    // In useAppState.ts

    const deleteTemplate = useCallback(async (templateId: string) => {
        try {
            // First, call the API to delete the template
            await api.deletePromptTemplate(templateId);

            // Only update the state if the API call was successful
            setState(prev => {
                // Get the default template to fall back to
                const defaultTemplate = prev.templates.find(t => t.isDefault) || DEFAULT_PROMPT_TEMPLATE;

                // Remove the template from the list
                const updatedTemplates = prev.templates.filter(t => t.id !== templateId);

                // If we're deleting the active template, switch to the default template
                const newActiveTemplate = prev.activeTemplate.id === templateId
                    ? defaultTemplate
                    : prev.activeTemplate;

                return {
                    ...prev,
                    templates: updatedTemplates,
                    activeTemplate: newActiveTemplate
                };
            });
        } catch (error) {
            console.error('Failed to delete template:', error);
            // You might want to show an error message to the user here
        }
    }, []);

    const setActiveTemplate = useCallback((template: PromptTemplate) => {
        setState(prev => ({
            ...prev,
            activeTemplate: template
        }));
    }, []);

    const setView = useCallback((view: 'generator' | 'batch') => {
        setState(prev => ({...prev, currentView: view}));
    }, []);

    const updateModelConfig = useCallback((config: Partial<ModelConfig>) => {
        setState(prev => ({
            ...prev,
            modelConfig: {...prev.modelConfig, ...config},
        }));
    }, []);

    const updateProcessingConfig = useCallback((config: Partial<ProcessingConfig>) => {
        setState(prev => ({
            ...prev,
            processingConfig: {...prev.processingConfig, ...config},
        }));
    }, []);

    const addExample = useCallback(async (image: File, caption: string) => {
        const newExample = await api.uploadExamplePair(image, caption);
        setState(prev => ({
            ...prev,
            examples: [...prev.examples, newExample],
        }));
    }, []);

    const removeExample = useCallback((id: number) => {
        setState(prev => ({
            ...prev,
            examples: prev.examples.filter(ex => ex.id !== id),
        }));
    }, []);

    const startProcessing = useCallback(async (folder: string) => {
        setState(prev => ({...prev, isProcessing: true}));
        await api.startBatchProcessing(folder);

        // Start polling for status
        const intervalId = setInterval(async () => {
            const status = await api.getProcessingStatus();
            setState(prev => ({
                ...prev,
                processedItems: status.processedItems,
                isProcessing: status.status !== 'completed',
            }));

            if (status.status === 'completed') {
                clearInterval(intervalId);
            }
        }, 1000);
    }, []);

    const stopProcessing = useCallback(async () => {
        await api.stopBatchProcessing();
        setState(prev => ({...prev, isProcessing: false}));
    }, []);

    const generateCaption = useCallback(async (image: File) => {
        return api.generateCaption(image, state.examples);
    }, [state.examples]);

    return {
        state,
        setView,
        updateModelConfig,
        updateProcessingConfig,
        addExample,
        removeExample,
        startProcessing,
        stopProcessing,
        generateCaption,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        setActiveTemplate,
    };
}