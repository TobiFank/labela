// frontend/src/components/generator/TestPanel.tsx
import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Copy, Edit, Upload} from 'lucide-react';
import {ModelConfig} from '@/lib/types';

interface TestPanelProps {
    onGenerateCaption: (image: File) => Promise<string>;
    modelConfig: ModelConfig;
}

const TestPanel: React.FC<TestPanelProps> = ({onGenerateCaption, modelConfig}) => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [generatedCaption, setGeneratedCaption] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!selectedImage) return;
        setIsGenerating(true);
        try {
            const caption = await onGenerateCaption(selectedImage);
            setGeneratedCaption(caption);
        } catch (error) {
            console.error('Failed to generate caption:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCaption);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Test Image</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center bg-blue-50">
                        <input
                            type="file"
                            id="test-image"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                        <label htmlFor="test-image" className="cursor-pointer block">
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="max-h-48 mx-auto rounded-lg"
                                />
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 text-blue-400 mx-auto mb-2"/>
                                    <p className="text-blue-600">
                                        Drop image to test caption generation
                                    </p>
                                </>
                            )}
                        </label>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Generated Caption</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg min-h-[150px] mb-4">
                        {isEditing ? (
                            <textarea
                                className="w-full h-full min-h-[120px] p-2 rounded border"
                                value={generatedCaption}
                                onChange={(e) => setGeneratedCaption(e.target.value)}
                            />
                        ) : (
                            <p className="text-gray-600">
                                {generatedCaption || 'Generated caption will appear here...'}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <button
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                onClick={handleCopy}
                            >
                                <Copy className="w-4 h-4"/>
                            </button>
                            <button
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                <Edit className="w-4 h-4"/>
                            </button>
                        </div>
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                            onClick={handleGenerate}
                            disabled={!selectedImage || isGenerating}
                        >
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600">Examples</p>
                            <p className="font-medium">3</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600">Tokens</p>
                            <p className="font-medium">1,234</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600">Cost</p>
                            <p className="font-medium">
                                ${((modelConfig.costPerToken * modelConfig.maxTokens) / 1000).toFixed(4)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};

export default TestPanel;