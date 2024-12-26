// frontend/src/components/generator/ChatPreview.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamplePair, PromptTemplate } from '@/lib/types';

interface ChatPreviewProps {
    examples: ExamplePair[];
    activeTemplate: PromptTemplate;
}

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{
        type: string;
        text?: string;
        image_url?: {
            url: string;
            isExample?: boolean;
            filename?: string;
        }
    }>;
}

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isSystem = message.role === 'system';
    const isUser = message.role === 'user';

    const getImageUrl = (imagePath: string) => {
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        return `http://localhost:8000${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[80%] ${isSystem ? 'w-full' : ''}`}>
                {/* Role indicator */}
                <div className="text-xs text-gray-500 mb-1 px-2">
                    {message.role.charAt(0).toUpperCase() + message.role.slice(1)}
                </div>

                {/* Message content */}
                <div className={`rounded-lg p-3 ${
                    isSystem
                        ? 'bg-gray-100 text-gray-700'
                        : isUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-800'
                }`}>
                    {Array.isArray(message.content) ? (
                        <div className="space-y-2">
                            {message.content.map((item, index) => (
                                <div key={index}>
                                    {item.type === 'text' && (
                                        <div className="text-sm whitespace-pre-wrap">{item.text}</div>
                                    )}
                                    {item.type === 'image_url' && (
                                        <div className="mt-2">
                                            {item.image_url?.isExample ? (
                                                <div>
                                                    <div className="text-xs opacity-75 mb-1">
                                                        Example Image: {item.image_url.filename}
                                                    </div>
                                                    <img
                                                        src={getImageUrl(item.image_url.url)}
                                                        alt={item.image_url.filename || "Example image"}
                                                        className="max-h-40 rounded-lg object-contain bg-black/5 w-full"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="bg-black/10 rounded p-2 text-xs">
                                                    [Image to caption]
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ChatPreview: React.FC<ChatPreviewProps> = ({ examples, activeTemplate }) => {
    const messages: Message[] = [
        {
            role: 'system',
            content: "You are a highly accurate image captioning assistant. Your task is to generate detailed, accurate captions for images based on what you can directly observe. Follow the user's instructions carefully for the desired captioning style and format."
        }
    ];

    // Add examples with template for the first one
    examples.forEach((example, index) => {
        // For the first example, include the template
        if (index === 0) {
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: activeTemplate.content },
                    {
                        type: 'image_url',
                        image_url: {
                            url: example.image,
                            isExample: true,
                            filename: example.filename
                        }
                    }
                ]
            });
        } else {
            // For subsequent examples, just the image
            messages.push({
                role: 'user',
                content: [
                    {
                        type: 'image_url',
                        image_url: {
                            url: example.image,
                            isExample: true,
                            filename: example.filename
                        }
                    }
                ]
            });
        }

        // Assistant's response for each example
        messages.push({
            role: 'assistant',
            content: example.caption
        });
    });

    // Add the target image message
    messages.push({
        role: 'user',
        content: examples.length === 0 && activeTemplate.content
            ? [
                { type: 'text', text: activeTemplate.content },
                {
                    type: 'image_url',
                    image_url: { url: '' }
                }
            ]
            : [
                {
                    type: 'image_url',
                    image_url: { url: '' }
                }
            ]
    });

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Chat Preview</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto max-h-[calc(100vh-12rem)]">
                <div className="space-y-4">
                    {messages.map((message, index) => (
                        <ChatMessage key={index} message={message} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default ChatPreview;