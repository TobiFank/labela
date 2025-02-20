// frontend/src/components/settings/SettingsModal.tsx
import React, {useEffect, useState} from 'react';
import {ModelConfig, ProcessingConfig} from '@/lib/types';
import ProcessingSettings from './tabs/ProcessingSettings';
import ModelSettings from './tabs/ModelSettings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    modelConfig: ModelConfig;
    processingConfig: ProcessingConfig;
    onUpdateModelConfig: (config: Partial<ModelConfig>) => void;
    onUpdateProcessingConfig: (config: Partial<ProcessingConfig>) => void;
}

type TabType = 'processing' | 'models';

const SettingsModal: React.FC<SettingsModalProps> = ({
                                                         isOpen,
                                                         onClose,
                                                         modelConfig,
                                                         processingConfig,
                                                         onUpdateModelConfig,
                                                         onUpdateProcessingConfig,
                                                     }) => {
    const [activeTab, setActiveTab] = useState<TabType>('models');
    const [localModelConfig, setLocalModelConfig] = useState(modelConfig);
    const [localProcessingConfig, setLocalProcessingConfig] = useState(processingConfig);

    // Reset local state when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalModelConfig(modelConfig);
            setLocalProcessingConfig(processingConfig);
        }
    }, [isOpen, modelConfig, processingConfig]);

    const handleSave = () => {
        onUpdateModelConfig(localModelConfig);
        onUpdateProcessingConfig(localProcessingConfig);
        onClose();
    };

    const handleModelConfigUpdate = (config: Partial<ModelConfig>) => {
        setLocalModelConfig(prev => ({
            ...prev,
            ...config
        }));
    };

    const handleProcessingConfigUpdate = (config: Partial<ProcessingConfig>) => {
        setLocalProcessingConfig(prev => ({
            ...prev,
            ...config
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Settings</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <div className="flex space-x-4 border-b mb-4">
                        {(['processing', 'models'] as TabType[]).map(tab => (
                            <button
                                key={tab}
                                className={`px-4 py-2 ${
                                    activeTab === tab
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-600'
                                }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        {activeTab === 'models' && (
                            <ModelSettings
                                config={localModelConfig}
                                onUpdate={handleModelConfigUpdate}
                            />
                        )}
                        {activeTab === 'processing' && (
                            <ProcessingSettings
                                config={localProcessingConfig}
                                onUpdate={handleProcessingConfigUpdate}
                            />
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            onClick={handleSave}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;