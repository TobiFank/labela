import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FolderOpen, Pause, Play } from 'lucide-react';
import { ProcessedItem } from '@/lib/types';
import StatusSection from './StatusSection';
import LiveFeed from './LiveFeed';
import ProcessedGallery from './ProcessedGallery';
import FolderSelect from './FolderSelect';
import QuickReview from './QuickReview';

interface BatchProcessingViewProps {
    isProcessing: boolean;
    processedItems: ProcessedItem[];
    onStartProcessing: (folder: string) => Promise<void>;
    onStopProcessing: () => Promise<void>;
}

const BatchProcessingView: React.FC<BatchProcessingViewProps> = ({
                                                                     isProcessing,
                                                                     processedItems,
                                                                     onStartProcessing,
                                                                     onStopProcessing,
                                                                 }) => {
    const [selectedImage, setSelectedImage] = useState<ProcessedItem | null>(null);
    const [showFolderSelect, setShowFolderSelect] = useState(false);
    const [showQuickReview, setShowQuickReview] = useState(false);
    const [sourceFolder, setSourceFolder] = useState('/projects/architecture/raw');

    const handleFolderSelect = async (folder: string) => {
        setSourceFolder(folder);
        setShowFolderSelect(false);
        await onStartProcessing(folder);
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Top Controls Section */}
            <div className="p-6 border-b">
    <StatusSection
        sourceFolder={sourceFolder}
    isProcessing={isProcessing}
    onFolderSelectClick={() => setShowFolderSelect(true)}
    onProcessingToggle={isProcessing ? onStopProcessing : () => onStartProcessing(sourceFolder)}
    processedCount={processedItems.length}
    totalCount={1234} // This would come from your backend
    />
    </div>

    {/* Live Feed & Gallery Section */}
    <div className="flex-1 p-6 overflow-hidden">
    <div className="grid grid-cols-5 gap-6 h-full">
        {/* Live Feed */}
        <div className="col-span-1 overflow-hidden flex flex-col">
    <LiveFeed processedItems={processedItems} />
    </div>

    {/* Processed Images Gallery */}
    <div className="col-span-4 overflow-hidden flex flex-col">
    <ProcessedGallery
        items={processedItems}
    onImageSelect={setSelectedImage}
    onReviewModeToggle={() => setShowQuickReview(true)}
    />
    </div>
    </div>
    </div>

    {/* Modals */}
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
}> = ({ image, onClose }) => {
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
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        </svg>
        </button>
        </div>
        <img
    src={image.image}
    alt={image.filename}
    className="w-full rounded-lg mb-4"
    />
    <p className="text-gray-600">{image.caption}</p>
        </div>
        </div>
);
};

export default BatchProcessingView;