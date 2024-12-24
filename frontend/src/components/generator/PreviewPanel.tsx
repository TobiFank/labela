// frontend/src/components/generator/PreviewPanel.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamplePair, PromptTemplate } from '@/lib/types';

interface PreviewPanelProps {
    examples: ExamplePair[];
    activeTemplate: PromptTemplate;
    testImage?: File;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
                                                       examples,
                                                       activeTemplate,
                                                   }) => {
    const formatMessage = (role: string, content: string | object) => {
        return `{
  "role": "${role}",
  "content": ${JSON.stringify(content, null, 2)}
}`;
    };

    const getPromptPreview = () => {
        const messages = [];

        // Add examples with template for the first one
        examples.forEach((example, index) => {
            // For the first example, include the template
            if (index === 0) {
                messages.push(formatMessage("user", [
                    { type: "text", text: activeTemplate.content },
                    {
                        type: "image_url",
                        image_url: {
                            url: "[Base64 Image Content of example image]"
                        }
                    }
                ]));
            } else {
                // For subsequent examples, just the image
                messages.push(formatMessage("user", [
                    {
                        type: "image_url",
                        image_url: {
                            url: "[Base64 Image Content of example image]"
                        }
                    }
                ]));
            }

            // Assistant's response for each example
            messages.push(formatMessage("assistant", example.caption));
        });

        // Add the target image message
        const targetImageMessage = examples.length === 0 && activeTemplate.content
            ? [
                { type: "text", text: activeTemplate.content },
                {
                    type: "image_url",
                    image_url: {
                        url: "[Base64 Image Content of the target image]"
                    }
                }
            ]
            : [
                {
                    type: "image_url",
                    image_url: {
                        url: "[Base64 Image Content of the target image]"
                    }
                }
            ];

        messages.push(formatMessage("user", targetImageMessage));

        return `// OpenAI Chat Completion Messages Array
[
${messages.join(',\n')}
]`;
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>LLM Input Preview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono">
                    <pre className="text-green-400 whitespace-pre-wrap overflow-auto max-h-[calc(100vh-12rem)]">
                        {getPromptPreview()}
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
};

export default PreviewPanel;