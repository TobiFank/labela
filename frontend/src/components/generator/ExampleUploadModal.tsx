// frontend/src/components/generator/ExampleUploadModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';

interface ExampleUploadModalProps {
    onClose: () => void;
    onUpload: (image: File, caption: string) => Promise<void>;
}

const ExampleUploadModal: React.FC<ExampleUploadModalProps> = ({ onClose, onUpload }) => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [captionFile, setCaptionFile] = useState<File | null>(null);

    const handleImageSelect = (file: File) => {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleCaptionFileSelect = async (file: File) => {
        setCaptionFile(file);
        const text = await file.text();
        setCaption(text);
    };

    const handleUpload = async () => {
        if (!selectedImage || !caption.trim()) return;

        try {
            let finalCaption = caption;
            if (captionFile) {
                finalCaption = await captionFile.text();
            }

            await onUpload(selectedImage, finalCaption);
            onClose();
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Upload Example</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Image Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                            type="file"
                            id="image-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageSelect(file);
                            }}
                        />
                        <label htmlFor="image-upload" className="cursor-pointer block text-center">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Drop image or click to select</p>
                                </>
                            )}
                        </label>
                    </div>

                    {/* Caption Input */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                id="caption-upload"
                                className="hidden"
                                accept=".txt"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleCaptionFileSelect(file);
                                }}
                            />
                            <label
                                htmlFor="caption-upload"
                                className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer text-sm"
                            >
                                Upload Caption File
                            </label>
                            <span className="text-sm text-gray-500">(optional)</span>
                        </div>

                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="w-full p-3 border rounded-lg resize-none h-32"
                            placeholder="Enter caption here or upload a caption file..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={!selectedImage || !caption.trim()}>
                        Upload Example
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ExampleUploadModal;