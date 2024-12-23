// frontend/src/components/generator/PreviewPanel.tsx
import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ExamplePair} from '@/lib/types';

interface PreviewPanelProps {
    examples: ExamplePair[];
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({examples}) => {
    const formatExampleText = (example: ExamplePair) => {
        return `[Image: ${example.filename}]\nCaption: ${example.caption}`;
    };

    const getPromptPreview = () => {
        const basePrompt = 'Generate a caption for the image following these guidelines...';
        const exampleText = examples
            .map((ex, index) => `\n\n# Example ${index + 1}\n${formatExampleText(ex)}`)
            .join('');

        return `# Base Prompt\n${basePrompt}${exampleText}\n\n# New Image\n[Image: test.jpg]\nGenerate caption:`;
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>LLM Input Preview</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono">
                    <pre className="text-green-400 whitespace-pre-wrap">
                        {getPromptPreview()}
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
};

export default PreviewPanel;