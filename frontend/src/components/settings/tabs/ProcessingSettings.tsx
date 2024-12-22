// frontend/src/components/settings/tabs/ProcessingSettings.tsx
import React from 'react';
import {ProcessingConfig} from '@/lib/types';

interface ProcessingSettingsProps {
    config: ProcessingConfig;
    onUpdate: (config: Partial<ProcessingConfig>) => void;
}

const ProcessingSettings: React.FC<ProcessingSettingsProps> = ({
                                                                   config,
                                                                   onUpdate,
                                                               }) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Size
                </label>
                <select
                    className="w-full p-2 border rounded-lg"
                    value={config.batchSize}
                    onChange={(e) => onUpdate({batchSize: parseInt(e.target.value)})}
                >
                    <option value={50}>50 images per batch</option>
                    <option value={100}>100 images per batch</option>
                    <option value={200}>200 images per batch</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Error Handling
                </label>
                <select
                    className="w-full p-2 border rounded-lg"
                    value={config.errorHandling}
                    onChange={(e) => onUpdate({
                        errorHandling: e.target.value as 'continue' | 'stop'
                    })}
                >
                    <option value="continue">Continue on error</option>
                    <option value="stop">Stop on error</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concurrent Processing
                </label>
                <select
                    className="w-full p-2 border rounded-lg"
                    value={config.concurrentProcessing}
                    onChange={(e) => onUpdate({
                        concurrentProcessing: parseInt(e.target.value)
                    })}
                >
                    <option value={1}>1 image at a time</option>
                    <option value={2}>2 images at a time</option>
                    <option value={4}>4 images at a time</option>
                </select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-700 mb-2">Processing Tips</h4>
                <ul className="text-sm text-blue-600 space-y-1">
                    <li>• Smaller batch sizes are better for testing</li>
                    <li>• Higher concurrency may increase costs</li>
                    <li>• Consider API rate limits when configuring</li>
                </ul>
            </div>
        </div>
    );
};

export default ProcessingSettings;