// frontend/src/components/batch_processing/StatusSection.tsx
import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {FolderOpen, Pause, Play} from 'lucide-react';

interface StatusSectionProps {
    sourceFolder: string;
    isProcessing: boolean;
    onFolderSelectClick: () => void;
    onProcessingToggle: () => void;
    processedCount: number;
    totalCount: number;
}

const StatusSection: React.FC<StatusSectionProps> = ({
                                                         sourceFolder,
                                                         isProcessing,
                                                         onFolderSelectClick,
                                                         onProcessingToggle,
                                                         processedCount,
                                                         totalCount,
                                                     }) => {
    const progress = (processedCount / totalCount) * 100;
    const estimatedTimeLeft = '3.5 hours'; // This would be calculated based on processing speed
    const processingSpeed = '5.2/min';
    const estimatedCost = '$0.47';
    const estimatedCompletion = '6:30 PM';

    return (
        <div className="grid grid-cols-3 gap-6">
            {/* Source & Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Source Images</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-gray-600">Source:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-gray-800">{sourceFolder}</span>
                                <button
                                    onClick={onFolderSelectClick}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <FolderOpen className="w-4 h-4 text-gray-600"/>
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Progress:</span>
                            <span className="font-medium">{processedCount}/{totalCount} images</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Progress & Controls */}
            <Card>
                <CardContent className="p-4">
                    <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                            {progress.toFixed(0)}%
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{width: `${progress}%`}}
                            />
                        </div>
                    </div>
                    <div className="flex justify-center">
                        {isProcessing ? (
                            <button
                                className="px-6 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 flex items-center gap-2"
                                onClick={onProcessingToggle}
                            >
                                <Pause className="w-4 h-4"/>
                                Pause Processing
                            </button>
                        ) : (
                            <button
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                onClick={onProcessingToggle}
                            >
                                <Play className="w-4 h-4"/>
                                {processedCount === 0 ? 'Start Processing' : 'Resume Processing'}
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600 text-sm">Time Left</p>
                            <p className="font-medium">{estimatedTimeLeft}</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600 text-sm">Speed</p>
                            <p className="font-medium">{processingSpeed}</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600 text-sm">Cost</p>
                            <p className="font-medium">{estimatedCost}</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600 text-sm">Completion</p>
                            <p className="font-medium">{estimatedCompletion}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StatusSection;