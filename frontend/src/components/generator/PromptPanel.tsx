// frontend/src/components/generator/PromptPanel.tsx
import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

const PromptPanel: React.FC = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Base Prompt</span>
                    <button className="text-sm text-blue-600 hover:text-blue-700">
                        View Full Template
                    </button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-gray-600">Using: Architecture Description Template</p>
                    <p className="text-gray-500 mt-2">
                        &#34;Generate a caption for the image focusing on objective features...&#34;
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default PromptPanel;