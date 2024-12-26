// frontend/src/components/generator/PreviewPanel.tsx
import React from 'react';
import { ExamplePair, PromptTemplate } from '@/lib/types';
import ChatPreview from './ChatPreview';

interface PreviewPanelProps {
    examples: ExamplePair[];
    activeTemplate: PromptTemplate;
    testImage?: File;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
                                                       examples,
                                                       activeTemplate,
                                                   }) => {
    return (
        <ChatPreview
            examples={examples}
            activeTemplate={activeTemplate}
        />
    );
};

export default PreviewPanel;