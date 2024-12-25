// frontend/src/components/batch_processing/QuickReview.tsx
import React, {useState} from 'react';
import {Check, ChevronLeft, ChevronRight, Edit, Flag} from 'lucide-react';
import {ProcessedItem} from '@/lib/types';
import {api} from '@/lib/api';

interface QuickReviewProps {
    items: ProcessedItem[];
    onClose: () => void;
}

const QuickReview: React.FC<QuickReviewProps> = ({items, onClose}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [editedCaption, setEditedCaption] = useState(items[0]?.caption || '');
    const [isSaving, setIsSaving] = useState(false);
    const [updatedItems, setUpdatedItems] = useState<ProcessedItem[]>(items);

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setEditedCaption(updatedItems[currentIndex - 1].caption);
            setEditMode(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setEditedCaption(updatedItems[currentIndex + 1].caption);
            setEditMode(false);
        }
    };

    const handleApproveAndNext = async () => {
        if (editMode && editedCaption !== updatedItems[currentIndex].caption) {
            setIsSaving(true);
            try {
                // Update the caption
                const updatedItem = await api.updateProcessedItemCaption(
                    updatedItems[currentIndex].id,
                    editedCaption
                );

                // Update local state
                setUpdatedItems(prevItems =>
                    prevItems.map(item =>
                        item.id === updatedItem.id ? updatedItem : item
                    )
                );

                // Exit edit mode
                setEditMode(false);

                // Move to next item
                handleNext();
            } catch (error) {
                console.error('Failed to save caption:', error);
                alert('Failed to save caption changes. Please try again.');
            } finally {
                setIsSaving(false);
            }
        } else {
            handleNext();
        }
    };

    const getImageUrl = (imagePath: string) => {
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        return `http://localhost:8000/api${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    };

    const currentItem = updatedItems[currentIndex];

    if (!currentItem) return null;

    return (
        <div className="fixed inset-0 bg-white z-50 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium">Quick Review Mode</h2>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                    Exit Review Mode
                </button>
            </div>
            <div className="flex flex-col h-[calc(100vh-120px)]">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">
                        Reviewing {currentIndex + 1} of {items.length}
                    </span>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <Flag className="w-4 h-4 text-gray-600"/>
                        </button>
                        <button
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            onClick={() => setEditMode(!editMode)}
                        >
                            <Edit className="w-4 h-4 text-gray-600"/>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 flex-grow">
                    <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center h-full">
                        <img
                            src={getImageUrl(currentItem.image)}
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

                <div className="flex justify-between items-center mt-4">
                    <button
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        onClick={handlePrevious}
                        disabled={currentIndex === 0 || isSaving}
                    >
                        <ChevronLeft className="w-5 h-5"/>
                    </button>

                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:bg-green-300"
                        onClick={handleApproveAndNext}
                        disabled={currentIndex === items.length - 1 || isSaving}
                    >
                        <Check className="w-4 h-4"/>
                        {isSaving ? 'Saving...' : 'Approve & Next'}
                    </button>

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