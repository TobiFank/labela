// frontend/src/components/generator/PreviewPanel.tsx
import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ExamplePair, PromptTemplate} from '@/lib/types';

interface PreviewPanelProps {
    examples: ExamplePair[];
    activeTemplate: PromptTemplate;
    testImage?: File;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
                                                       examples,
                                                       activeTemplate,
                                                       testImage
                                                   }) => {
    const formatExampleText = (example: ExamplePair) => {
        return `[Image: ${example.filename}]\nCaption: ${example.caption}`;
    };

    const getPromptPreview = () => {
        const exampleText = examples
            .map((ex, index) => `\n\n# Example ${index + 1}\n${formatExampleText(ex)}`)
            .join('');

        return `# Template\n${activeTemplate.content}${exampleText}\n\n# New Image\n[Image: ${testImage?.name || 'No image selected'}]\nGenerate caption:`;
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>LLM Input Preview</CardTitle>
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