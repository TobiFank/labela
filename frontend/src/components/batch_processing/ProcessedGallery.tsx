// frontend/src/components/batch_processing/ProcessedGallery.tsx
import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Edit} from 'lucide-react';
import {ProcessedItem} from '@/lib/types';

interface ProcessedGalleryProps {
    items: ProcessedItem[];
    onImageSelect: (item: ProcessedItem) => void;
    onReviewModeToggle: () => void;
}

const ProcessedGallery: React.FC<ProcessedGalleryProps> = ({
                                                               items,
                                                               onImageSelect,
                                                               onReviewModeToggle,
                                                           }) => {
    const [editingCaptionId, setEditingCaptionId] = useState<number | null>(null);

    const handleCaptionSave = (id: number, newCaption: string) => {
        // In a real app, you'd update the caption in your state management
        console.log('Saving caption:', id, newCaption);
        setEditingCaptionId(null);
    };

    const getImageUrl = (imagePath: string) => {
        // If the URL is already complete, return it
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        // Otherwise, prepend the base URL
        return `http://localhost:8000/api${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    };

    return (
        <Card className="flex-1 flex flex-col max-h-[calc(100vh-200px)]">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Processed Images</span>
                    <button
                        onClick={onReviewModeToggle}
                        className="px-4 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                    >
                        Review Mode
                    </button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="border rounded-lg p-3">
                            <div className="space-y-3">
                                {/* Image Preview */}
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={getImageUrl(item.image)}
                                        alt={item.filename}
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                                        onClick={() => onImageSelect(item)}
                                    />
                                </div>

                                {/* Caption & Info */}
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-medium truncate">
                                            {item.filename}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(item.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>

                                    {editingCaptionId === item.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                className="w-full p-2 text-sm border rounded-lg"
                                                rows={3}
                                                defaultValue={item.caption}
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                                                    onClick={() => setEditingCaptionId(null)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    onClick={() => handleCaptionSave(item.id, item.caption)}
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="group relative">
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {item.caption}
                                            </p>
                                            <button
                                                className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setEditingCaptionId(item.id)}
                                            >
                                                <Edit className="w-4 h-4 text-gray-400 hover:text-gray-600"/>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Status Indicator */}
                                {item.status === 'error' && (
                                    <div className="text-xs text-red-600 mt-1">
                                        Error: {item.error_message}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default ProcessedGallery;