// frontend/src/components/settings/tabs/PromptSettings.tsx
import React from 'react';

const PromptSettings: React.FC = () => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt Template
                </label>
                <textarea
                    className="w-full h-48 p-3 border rounded-lg text-sm font-mono"
                    defaultValue="Generate a caption for the image following these guidelines..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        className="w-full"
                        min="0"
                        max="1"
                        step="0.1"
                        defaultValue="0.7"
                    />
                    <span className="text-sm text-gray-600">0.7</span>
                </div>
            </div>
        </div>
    );
};

export default PromptSettings;