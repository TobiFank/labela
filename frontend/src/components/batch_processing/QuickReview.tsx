// frontend/src/components/batch_processing/QuickReview.tsx
import React, {useEffect, useState} from 'react';
import {Check, ChevronLeft, ChevronRight, Edit} from 'lucide-react';
import {ProcessedItem} from '@/lib/types';

interface QuickReviewProps {
    items: ProcessedItem[];
    onClose: () => void;
    onCaptionUpdate: (itemId: number, newCaption: string) => Promise<void>;
}

const QuickReview: React.FC<QuickReviewProps> = ({items, onClose, onCaptionUpdate}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [editedCaption, setEditedCaption] = useState(items[0]?.caption || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (items[currentIndex]) {
            setEditedCaption(items[currentIndex].caption);
        }
    }, [currentIndex, items]);

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setEditMode(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setEditMode(false);
        }
    };

    const handleSave = async () => {
        if (!editMode || editedCaption === items[currentIndex].caption) {
            return;
        }

        setIsSaving(true);
        try {
            await onCaptionUpdate(items[currentIndex].id, editedCaption);
            setEditMode(false);
        } catch (error) {
            console.error('Failed to save caption:', error);
            alert('Failed to save caption changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const currentItem = items[currentIndex];
    if (!currentItem) return null;

    return (
        <div className="fixed inset-0 bg-white z-50 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium">Quick Review Mode</h2>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                    Exit Review Mode
                </button>
            </div>

            {/* Main content */}
            <div className="flex flex-col h-[calc(100vh-120px)]">
                {/* Navigation info */}
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">
                        Reviewing {currentIndex + 1} of {items.length}
                    </span>
                    <div className="flex gap-2">
                        <button
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            onClick={() => setEditMode(!editMode)}
                        >
                            <Edit className="w-4 h-4 text-gray-600"/>
                        </button>
                    </div>
                </div>

                {/* Image and Caption */}
                <div className="grid grid-cols-2 gap-4 flex-grow">
                    <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                            src={`http://localhost:8000/api${currentItem.image}`}
                            alt={currentItem.filename}
                            className="max-w-full max-h-[70vh] object-contain"
                        />
                    </div>

                    <div className="flex flex-col">
                        {editMode ? (
                            <textarea
                                className="w-full h-full p-3 border rounded-lg text-sm resize-none"
                                value={editedCaption}
                                onChange={(e) => setEditedCaption(e.target.value)}
                            />
                        ) : (
                            <p className="text-gray-600 text-sm">{currentItem.caption}</p>
                        )}
                    </div>
                </div>

                {/* Footer controls */}
                <div className="flex justify-between items-center mt-4">
                    <button
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        onClick={handlePrevious}
                        disabled={currentIndex === 0 || isSaving}
                    >
                        <ChevronLeft className="w-5 h-5"/>
                    </button>

                    {editMode && (
                        <button
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:bg-green-300"
                            onClick={handleSave}
                            disabled={isSaving || editedCaption === items[currentIndex].caption}
                        >
                            <Check className="w-4 h-4"/>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}

                    <button
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        onClick={handleNext}
                        disabled={currentIndex === items.length - 1 || isSaving}
                    >
                        <ChevronRight className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickReview;