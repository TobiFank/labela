// frontend/src/components/generator/TestPanel.tsx
import React, {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Copy, Upload} from 'lucide-react';
import {ExamplePair, ModelConfig, PromptTemplate} from '@/lib/types';
import {calculateCost, countTokens, getImageDimensions, getImageTokenCount} from '@/lib/utils/tokenCounter';

interface TestPanelProps {
    onGenerateCaption: (image: File) => Promise<string>;
    modelConfig: ModelConfig;
    examples: ExamplePair[];
    activeTemplate: PromptTemplate;
    onAddExample: (image: File, caption: string) => Promise<void>;
}

const TestPanel: React.FC<TestPanelProps> = ({
                                                 onGenerateCaption,
                                                 modelConfig,
                                                 examples = [], // Provide default empty array
                                                 activeTemplate,
                                                 onAddExample
                                             }) => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [generatedCaption, setGeneratedCaption] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [tokenCount, setTokenCount] = useState(countTokens(activeTemplate, examples));

    const [selectedImageTokens, setSelectedImageTokens] = useState(0);

    useEffect(() => {
        async function updateImageTokens() {
            if (selectedImage) {
                const dimensions = await getImageDimensions(selectedImage);
                const tokens = getImageTokenCount(dimensions.width, dimensions.height);
                setSelectedImageTokens(tokens);
            } else {
                setSelectedImageTokens(0);
            }
        }

        updateImageTokens();
    }, [selectedImage]);

    const adjustedTokenCount = {
        ...tokenCount,
        imageTokens: tokenCount.imageTokens + selectedImageTokens,
        totalTokens: tokenCount.totalTokens + selectedImageTokens
    };

    // Update token count when examples or template changes
    useEffect(() => {
        setTokenCount(countTokens(activeTemplate, examples));
    }, [examples, activeTemplate]);

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
            await onAddExample(selectedImage, caption);
        } catch (error) {
            console.error('Failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCaption);
    };

    const estimatedCost = calculateCost(tokenCount, modelConfig.costPerToken);

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
                    <div className="flex justify-between items-center">
                        <div className="flex-1">
                            {generatedCaption ? (
                                <p className="text-gray-700 whitespace-pre-wrap">{generatedCaption}</p>
                            ) : (
                                <p className="text-gray-500 italic">No caption generated yet</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {generatedCaption && (
                                <button
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    onClick={handleCopy}
                                >
                                    <Copy className="w-4 h-4"/>
                                </button>
                            )}
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                                onClick={handleGenerate}
                                disabled={!selectedImage || isGenerating}
                            >
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600">Examples</p>
                            <p className="font-medium">{examples.length}</p>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600">Total Tokens</p>
                            <p className="font-medium">{adjustedTokenCount.totalTokens.toLocaleString()}</p>
                            <div className="text-xs text-gray-500 mt-1">
                                <div>System: {adjustedTokenCount.systemPromptTokens}</div>
                                <div>Template: {adjustedTokenCount.templateTokens}</div>
                                <div>Examples: {adjustedTokenCount.exampleTokens}</div>
                                <div>Images: {adjustedTokenCount.imageTokens}</div>
                            </div>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600">Cost</p>
                            <p className="font-medium">${estimatedCost.toFixed(4)}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                ${modelConfig.costPerToken.toFixed(4)}/1K tokens
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};

export default TestPanel;