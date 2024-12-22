// frontend/src/components/batch_processing/QuickReview.tsx
import React, {useState} from 'react';
import {Check, ChevronLeft, ChevronRight, Edit, Flag} from 'lucide-react';
import {ProcessedItem} from '@/lib/types';

interface QuickReviewProps {
    items: ProcessedItem[];
    onClose: () => void;
}

const QuickReview: React.FC<QuickReviewProps> = ({items, onClose}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [editedCaption, setEditedCaption] = useState(items[0]?.caption || '');

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setEditedCaption(items[currentIndex - 1].caption);
            setEditMode(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setEditedCaption(items[currentIndex + 1].caption);
            setEditMode(false);
        }
    };

    const handleApproveAndNext = () => {
        // In a real app, you'd save any changes here
        if (editMode && editedCaption !== items[currentIndex].caption) {
            // Save the edited caption
            console.log('Saving edited caption:', editedCaption);
        }
        handleNext();
    };

    const currentItem = items[currentIndex];

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
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                            src={currentItem.image}
                            alt="Preview"
                            className="w-full h-full object-cover"
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
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft className="w-5 h-5"/>
                    </button>

                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        onClick={handleApproveAndNext}
                        disabled={currentIndex === items.length - 1}
                    >
                        <Check className="w-4 h-4"/>
                        Approve & Next
                    </button>

                    <button
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        onClick={handleNext}
                        disabled={currentIndex === items.length - 1}
                    >
                        <ChevronRight className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickReview;