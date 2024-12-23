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
    created_at: '',
    updated_at: null,
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
        const saved = await api.createPromptTemplate(template);
        setState(prev => ({
            ...prev,
            templates: [...prev.templates, saved]
        }));
    }, []);

    const updateTemplate = useCallback(async (template: PromptTemplate) => {
        const updated = await api.updatePromptTemplate(template.id, template);
        setState(prev => ({
            ...prev,
            templates: prev.templates.map(t =>
                t.id === updated.id ? updated : t
            ),
            activeTemplate: prev.activeTemplate.id === updated.id ? updated : prev.activeTemplate
        }));
    }, []);

    const deleteTemplate = useCallback((templateId: string) => {
        setState(prev => ({
            ...prev,
            templates: prev.templates.filter(t => t.id !== templateId)
        }));
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