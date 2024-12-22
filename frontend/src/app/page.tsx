// frontend/src/app/page.tsx
'use client';

import { useAppState } from '@/lib/hooks/useAppState';
import { useState } from 'react';
import GeneratorView from "@/components/generator/GeneratorView";
import SettingsModal from "@/components/settings/SettingsModal";
import Navigation from "@/components/shared/Navigation";
import BatchProcessingView from "@/components/batch_processing/BatchProcessingView";

const AppPage = () => {
    const {
        state,
        setView,
        updateModelConfig,
        updateProcessingConfig,
        addExample,
        removeExample,
        startProcessing,
        stopProcessing,
        generateCaption,
    } = useAppState();

    const [showSettingsModal, setShowSettingsModal] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation
                currentView={state.currentView}
                onViewChange={setView}
                onSettingsClick={() => setShowSettingsModal(true)}
            />

            {state.currentView === 'generator' ? (
                <GeneratorView
                    examples={state.examples}
                    onAddExample={addExample}
                    onRemoveExample={removeExample}
                    onGenerateCaption={generateCaption}
                    modelConfig={state.modelConfig}
                />
            ) : (
                <BatchProcessingView
                    isProcessing={state.isProcessing}
                    processedItems={state.processedItems}
                    onStartProcessing={startProcessing}
                    onStopProcessing={stopProcessing}
                />
            )}

            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                modelConfig={state.modelConfig}
                processingConfig={state.processingConfig}
                onUpdateModelConfig={updateModelConfig}
                onUpdateProcessingConfig={updateProcessingConfig}
            />
        </div>
    );
};

export default AppPage;