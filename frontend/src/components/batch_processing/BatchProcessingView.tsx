// frontend/src/components/batch_processing/BatchProcessingView.tsx
import React, {useEffect, useState} from 'react';
import {ExamplePair, ModelConfig, ProcessedItem, ProcessingConfig, PromptTemplate} from '@/lib/types';
import StatusSection, {FolderStats} from './StatusSection';
import LiveFeed from './LiveFeed';
import ProcessedGallery from './ProcessedGallery';
import FolderSelect from './FolderSelect';
import QuickReview from './QuickReview';
import {api} from '@/lib/api';

interface BatchProcessingViewProps {
    isProcessing: boolean;
    isPaused: boolean;
    processedItems: ProcessedItem[];
    onStartProcessing: (folder: string, reprocess?: boolean) => Promise<void>;
    onStopProcessing: () => Promise<void>;
    onPauseProcessing: () => Promise<void>;
    onResumeProcessing: () => Promise<void>;
    onUpdateProcessedItem: (itemId: number, caption: string) => Promise<void>;
    modelConfig: ModelConfig;
    processingConfig: ProcessingConfig;
    examples: ExamplePair[];
    activeTemplate: PromptTemplate;
    setProcessedItems: (items: ProcessedItem[]) => void;
}

const BatchProcessingView: React.FC<BatchProcessingViewProps> = ({
                                                                     isProcessing,
                                                                     isPaused,
                                                                     processedItems,
                                                                     onStartProcessing,
                                                                     onStopProcessing,
                                                                     onPauseProcessing,
                                                                     onResumeProcessing,
                                                                     modelConfig,
                                                                     examples,
                                                                     activeTemplate,
                                                                     onUpdateProcessedItem,
                                                                     setProcessedItems
                                                                 }) => {
    const [selectedImage, setSelectedImage] = useState<ProcessedItem | null>(null);
    const [showFolderSelect, setShowFolderSelect] = useState(false);
    const [showQuickReview, setShowQuickReview] = useState(false);
    const [sourceFolder, setSourceFolder] = useState('');
    const [totalImageCount, setTotalImageCount] = useState(0);
    const [startTime, setStartTime] = useState<Date | undefined>(undefined);
    const [folderStats, setFolderStats] = useState<FolderStats | undefined>(undefined);

    useEffect(() => {
        const fetchFolderStats = async () => {
            if (sourceFolder && !isProcessing) {
                try {
                    const stats = await api.getFolderContents(sourceFolder);
                    setFolderStats(stats);
                } catch (error: unknown) {
                    console.error('Failed to fetch folder stats:', error);
                }
            }
        };

        const pollInterval = setInterval(() => {
            if (isProcessing) {
                fetchFolderStats();
            }
        }, 2000);

        fetchFolderStats();
        return () => clearInterval(pollInterval);
    }, [sourceFolder, isProcessing]);

    const handleFolderSelect = async (folder: string, imageCount: number) => {
        setSourceFolder(folder);
        setTotalImageCount(imageCount);
        setShowFolderSelect(false);

        try {
            const stats = await api.getFolderContents(folder);

            if (stats.files) {
                const existingItems = stats.files
                    .filter(file => file.has_caption)
                    .map((file) => ({
                        id: hashFilename(file.filename),
                        filename: file.filename,
                        image: `/data/${folder.split('/').pop()}/${file.filename}`,
                        caption: file.caption || '',
                        status: 'success' as const,
                        timestamp: new Date(file.last_modified).toISOString(),
                    }));

                setProcessedItems(existingItems);
            }
            setFolderStats(stats);
        } catch (error) {
            console.error('Failed to fetch folder stats:', error);
        }
    };

    // Add this helper function for generating stable IDs
    const hashFilename = (filename: string): number => {
        // Simple string hash function
        let hash = 0;
        for (let i = 0; i < filename.length; i++) {
            const char = filename.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash); // Make sure it's positive
    };

    const handleStartProcessing = async () => {
        setStartTime(new Date());
        await onStartProcessing(sourceFolder);
    };

    const handleReprocessAll = async () => {
        if (window.confirm('Are you sure you want to reprocess all images? This will overwrite existing captions.')) {
            setStartTime(new Date());
            await onStartProcessing(sourceFolder, true);
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="p-6 border-b">
                <StatusSection
                    sourceFolder={sourceFolder}
                    isProcessing={isProcessing}
                    isPaused={isPaused}
                    onFolderSelectClick={() => setShowFolderSelect(true)}
                    onProcessingToggle={isProcessing ?
                        (isPaused ? onResumeProcessing : onPauseProcessing) :
                        handleStartProcessing
                    }
                    onStopProcessing={onStopProcessing}
                    processedCount={processedItems.length}
                    totalCount={totalImageCount}
                    startTime={startTime}
                    modelConfig={modelConfig}
                    activeTemplate={activeTemplate}
                    examples={examples}
                    folderStats={folderStats}
                    onReprocessAll={handleReprocessAll}
                />
            </div>

            <div className="flex-1 p-6 overflow-hidden">
                <div className="grid grid-cols-5 gap-6 h-full">
                    <div className="col-span-1 overflow-hidden flex flex-col">
                        <LiveFeed processedItems={processedItems}/>
                    </div>

                    <div className="col-span-4 overflow-hidden flex flex-col">
                        <ProcessedGallery
                            items={processedItems}
                            onImageSelect={setSelectedImage}
                            onReviewModeToggle={() => setShowQuickReview(true)}
                        />
                    </div>
                </div>
            </div>

            {showFolderSelect && (
                <FolderSelect
                    currentFolder={sourceFolder}
                    onSelect={handleFolderSelect}
                    onClose={() => setShowFolderSelect(false)}
                />
            )}

            {showQuickReview && (
                <QuickReview
                    items={processedItems}
                    onClose={() => setShowQuickReview(false)}
                    onCaptionUpdate={onUpdateProcessedItem}
                />
            )}

            {selectedImage && (
                <ImagePreviewModal
                    image={selectedImage}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </div>
    );
};

const ImagePreviewModal: React.FC<{
    image: ProcessedItem;
    onClose: () => void;
}> = ({image, onClose}) => {
    const getImageUrl = (imagePath: string) => {
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        return `http://localhost:8000/api${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6"
            onClick={onClose}
        >
            <div className="bg-white rounded-lg max-w-4xl w-full p-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium">{image.filename}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <img
                    src={getImageUrl(image.image)}
                    alt={image.filename}
                    className="w-full rounded-lg mb-4"
                />
                <p className="text-gray-600">{image.caption}</p>
            </div>
        </div>
    );
};

export default BatchProcessingView;