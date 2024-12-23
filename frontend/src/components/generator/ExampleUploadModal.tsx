// frontend/src/components/generator/ExampleUploadModal.tsx
import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";

interface ExampleUploadModalProps {
    onClose: () => void;
    onUpload: (image: File, caption: string) => Promise<void>;
}

const ExampleUploadModal: React.FC<ExampleUploadModalProps> = ({onClose, onUpload}) => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [captionFile, setCaptionFile] = useState<File | null>(null);

    const handleImageSelect = (file: File) => {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);

        // Try to find matching caption file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files?.[0]) handleCaptionFileSelect(files[0]);
        };
        input.click();
    };

    const handleCaptionFileSelect = async (file: File) => {
        setCaptionFile(file);
        const text = await file.text();
        setCaption(text);
    };

    const handleUpload = async () => {
        if (selectedImage && (caption || captionFile)) {
            const finalCaption = captionFile ? await captionFile.text() : caption;
            await onUpload(selectedImage, finalCaption);
            onClose();
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Upload Example Pair</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="single">
                    <TabsList>
                        <TabsTrigger value="single">Single File Upload</TabsTrigger>
                        <TabsTrigger value="paired">Paired Files Upload</TabsTrigger>
                    </TabsList>

                    <TabsContent value="single">
                        <div className="space-y-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageSelect(file);
                                }}
                            />
                            {imagePreview && (
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="Enter caption..."
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="paired">
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageSelect(file);
                                    }}
                                />
                                <input
                                    type="file"
                                    accept=".txt"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleCaptionFileSelect(file);
                                    }}
                                />
                            </div>
                            {imagePreview && (
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="Caption from file will appear here..."
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedImage || (!caption && !captionFile)}
                    >
                        Upload Example
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ExampleUploadModal;