// frontend/src/lib/hooks/useAppState.ts
import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, ModelConfig, ProcessingConfig, PromptTemplate} from '../types';
import {api} from '../api';

const DEFAULT_MODEL_CONFIG: ModelConfig = {
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: '',
    costPerToken: 0.01,
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
    content: 'I want you to create captions for the provided images. Focusing ONLY on what you can directly observe in the image. Follow these strict guidelines:\n' +
        '\n' +
        '1. Describe the building, its location, and visible surroundings using ONLY factual, objective terms.\n' +
        '2. State the weather conditions visible in the image without interpretation.\n' +
        '3. Describe any visible street-level activity or urban elements factually.\n' +
        '4. If present, describe the geometric facade of the building in detail, focusing on its observable features.\n' +
        '5. DO NOT use subjective or interpretive language like "striking", "beautiful", "serene", "inviting" or similar.\n' +
        '6. DO NOT make assumptions about atmosphere, feelings, or anything not directly visible in the image.\n' +
        '7. DO NOT use flowery or poetic language. Stick to clear, factual descriptions.\n' +
        '8. Focus solely on what is visible - do not invent or imagine elements not shown in the image. Caption the new image using ONLY objective, factual descriptions of what you can directly observe. Do not use any subjective or interpretive language. Describe the image as if you are a camera, not a poet or storyteller.',
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
        isPaused: false,
    });

    useEffect(() => {
        Promise.all([
            api.getPromptTemplates(),
            api.getExamples(),
            api.getSettings()
        ]).then(([templates, examples, settings]) => {
            console.log('Loaded settings:', settings);
            setState(prev => ({
                ...prev,
                templates,
                activeTemplate: templates[0] || DEFAULT_PROMPT_TEMPLATE,
                examples,
                modelConfig: {
                    ...DEFAULT_MODEL_CONFIG,
                    ...settings,
                },
                processingConfig: {
                    ...DEFAULT_PROCESSING_CONFIG,
                    ...settings,
                }
            }));
        });
    }, []);

    const pauseProcessing = useCallback(async () => {
        try {
            await api.pauseBatchProcessing();
            setState(prev => ({ ...prev, isPaused: true }));
        } catch (error) {
            console.error('Failed to pause processing:', error);
        }
    }, []);

    const resumeProcessing = useCallback(async () => {
        try {
            await api.resumeBatchProcessing();
            setState(prev => ({ ...prev, isPaused: false }));
        } catch (error) {
            console.error('Failed to resume processing:', error);
        }
    }, []);

    const updateModelConfig = useCallback(async (config: Partial<ModelConfig>) => {
        try {
            setState(prev => {
                const updatedConfig = {
                    ...prev.modelConfig,
                    ...config
                };
                // Update settings in the background
                api.updateSettings(updatedConfig)
                    .then(updatedSettings => {
                        setState(prevState => ({
                            ...prevState,
                            modelConfig: updatedSettings
                        }));
                    })
                    .catch(error => {
                        console.error('Failed to update model config:', error);
                    });

                // Immediately update local state
                return {
                    ...prev,
                    modelConfig: updatedConfig
                };
            });
        } catch (error) {
            console.error('Failed to update model config:', error);
        }
    }, []);

    const updateProcessingConfig = useCallback(async (config: Partial<ProcessingConfig>) => {
        try {
            const updatedConfig = {
                ...state.processingConfig,
                ...config
            };
            const updatedSettings = await api.updateSettings(updatedConfig);
            setState(prev => ({
                ...prev,
                processingConfig: updatedSettings
            }));
        } catch (error) {
            console.error('Failed to update processing config:', error);
        }
    }, [state.processingConfig]);

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


    const addExample = useCallback(async (image: File, caption: string) => {
        const newExample = await api.uploadExamplePair(image, caption);
        setState(prev => ({
            ...prev,
            examples: [...prev.examples, newExample],
        }));
    }, []);

    const removeExample = useCallback(async (id: number) => {
        try {
            await api.removeExample(id);
            setState(prev => ({
                ...prev,
                examples: prev.examples.filter(ex => ex.id !== id),
            }));
        } catch (error) {
            console.error('Failed to remove example:', error);
            // Optionally revert the UI state or show error message
        }
    }, []);

    // Store the interval ID in a ref so we can clean it up later
    const pollingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Cleanup effect for the polling interval
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    const startProcessing = useCallback(async (folder: string) => {
        setState(prev => ({...prev, isProcessing: true, isPaused: false}));
        try {
            await api.startBatchProcessing(
                folder,
                state.modelConfig,
                state.processingConfig
            );

            const startPolling = () => {
                // Clear any existing interval
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }

                pollingIntervalRef.current = setInterval(async () => {
                    try {
                        const status = await api.getProcessingStatus();
                        setState(prev => {
                            if (!prev.isProcessing) {
                                if (pollingIntervalRef.current) {
                                    clearInterval(pollingIntervalRef.current);
                                }
                                return prev;
                            }
                            return {
                                ...prev,
                                processedItems: status.processedItems || [],
                                isProcessing: status.status !== 'completed',
                            };
                        });

                        if (status.status === 'completed') {
                            if (pollingIntervalRef.current) {
                                clearInterval(pollingIntervalRef.current);
                            }
                        }
                    } catch (error) {
                        console.error('Error polling status:', error);
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                        }
                    }
                }, 1000);
            };

            startPolling();
        } catch (error) {
            console.error('Failed to start processing:', error);
            setState(prev => ({...prev, isProcessing: false}));
        }
    }, [state.modelConfig, state.processingConfig]);

    const stopProcessing = useCallback(async () => {
        await api.stopBatchProcessing();
        setState(prev => ({...prev, isProcessing: false, isPause: false}));
    }, []);

    const generateCaption = useCallback(async (image: File) => {
        const caption = await api.generateCaption(image);
        await addExample(image, caption);
        return caption;
    }, [addExample]);

    return {
        state,
        setView,
        updateModelConfig,
        updateProcessingConfig,
        addExample,
        removeExample,
        startProcessing,
        stopProcessing,
        pauseProcessing,
        resumeProcessing,
        generateCaption,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        setActiveTemplate,
    };
}