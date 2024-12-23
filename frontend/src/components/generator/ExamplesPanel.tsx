// frontend/src/components/generator/ExamplesPanel.tsx
import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Plus, Trash2, Upload} from 'lucide-react';
import {ExamplePair} from '@/lib/types';
import ExamplePreviewModal from "@/components/generator/ExamplePreviewModal";
import ExampleUploadModal from "@/components/generator/ExampleUploadModal";

interface ExamplesPanelProps {
    examples: ExamplePair[];
    onAddExample: (image: File, caption: string) => Promise<void>;
    onRemoveExample: (id: number) => void;
}

const ExamplesPanel: React.FC<ExamplesPanelProps> = ({
                                                         examples,
                                                         onAddExample,
                                                         onRemoveExample,
                                                     }) => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<{
        file: File;
        preview: string;
    } | null>(null);
    const [previewCaption, setPreviewCaption] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage({
                    file,
                    preview: reader.result as string,
                });
                setIsPreviewOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConfirmExample = async () => {
        if (previewImage && previewCaption.trim()) {
            await onAddExample(previewImage.file, previewCaption);
            setIsPreviewOpen(false);
            setPreviewImage(null);
            setPreviewCaption('');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Example Pairs</span>
                    <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600">
                        <Plus className="w-4 h-4"/>
                    </button>
                    <button onClick={() => setShowUploadModal(true)}>
                        <Plus className="w-4 h-4" />
                    </button>

                    {showUploadModal && (
                        <ExampleUploadModal
                            onClose={() => setShowUploadModal(false)}
                            onUpload={onAddExample}
                        />
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                            type="file"
                            id="example-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                        <label
                            htmlFor="example-upload"
                            className="cursor-pointer block"
                        >
                            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2"/>
                            <p className="text-sm text-gray-600">
                                Drop example pairs or select files
                            </p>
                        </label>
                    </div>

                    {examples.map((example) => (
                        <div key={example.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-3">
                                <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
                                    <img
                                        src={example.image}
                                        alt={example.filename}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                </div>
                                <div className="flex-grow">
                                    <p className="text-xs text-gray-500 mb-1">{example.filename}</p>
                                    <p className="text-sm text-gray-600">{example.caption}</p>
                                </div>
                                <button
                                    className="p-1 hover:bg-gray-200 rounded-full"
                                    onClick={() => onRemoveExample(example.id)}
                                >
                                    <Trash2 className="w-4 h-4 text-gray-500"/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {isPreviewOpen && previewImage && (
                    <ExamplePreviewModal
                        image={previewImage.preview}
                        caption={previewCaption}
                        onCaptionChange={setPreviewCaption}
                        onConfirm={handleConfirmExample}
                        onClose={() => {
                            setIsPreviewOpen(false);
                            setPreviewImage(null);
                            setPreviewCaption('');
                        }}
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default ExamplesPanel;