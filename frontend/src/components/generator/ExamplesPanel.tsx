// frontend/src/components/generator/ExamplesPanel.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from 'lucide-react';
import { ExamplePair } from '@/lib/types';
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
    const [showUploadModal, setShowUploadModal] = useState(false);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Example Pairs</span>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
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
                                    <Trash2 className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {showUploadModal && (
                    <ExampleUploadModal
                        onClose={() => setShowUploadModal(false)}
                        onUpload={onAddExample}
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default ExamplesPanel;