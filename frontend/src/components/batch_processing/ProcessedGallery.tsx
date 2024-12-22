import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Edit } from 'lucide-react';
import { ProcessedItem } from '@/lib/types';

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

    return (
        <Card className="flex-1 flex flex-col">
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
                <div className="space-y-6">
                    {items.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4">
                            <div className="space-y-4">
                                {/* Image Preview */}
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={item.image}
                                        alt={item.filename}
                                        className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                                        onClick={() => onImageSelect(item)}
                                    />
                                </div>

                                {/* Caption & Controls */}
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium">{item.filename}</span>
                                        <span className="text-sm text-gray-500">{item.timestamp}</span>
                                    </div>

                                    {editingCaptionId === item.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                className="w-full p-3 border rounded-lg text-sm"
                                                rows={3}
                                                defaultValue={item.caption}
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                                                    onClick={() => setEditingCaptionId(null)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    onClick={() => handleCaptionSave(item.id, item.caption)}
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="group relative">
                                            <p className="text-gray-600 pr-8">{item.caption}</p>
                                            <button
                                                className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setEditingCaptionId(item.id)}
                                            >
                                                <Edit className="w-4 h-4 text-gray-400 hover:text-gray-600"/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default ProcessedGallery;