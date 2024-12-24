// frontend/src/components/generator/GeneratorView.tsx
import React from 'react';
import {ExamplePair, ModelConfig, PromptTemplate} from '@/lib/types';
import PromptPanel from './PromptPanel';
import ExamplesPanel from './ExamplesPanel';
import TestPanel from './TestPanel';
import PreviewPanel from './PreviewPanel';

interface GeneratorViewProps {
    examples: ExamplePair[];
    onAddExample: (image: File, caption: string) => Promise<void>;
    onRemoveExample: (id: number) => void;
    onGenerateCaption: (image: File) => Promise<string>;
    modelConfig: ModelConfig;
    templates: PromptTemplate[];
    activeTemplate: PromptTemplate;
    onTemplateChange: (template: PromptTemplate) => void;
    onTemplateCreate: (template: PromptTemplate) => void;
    onTemplateUpdate: (template: PromptTemplate) => void;
    onTemplateDelete: (templateId: string) => void;
}

const GeneratorView: React.FC<GeneratorViewProps> = ({
                                                         examples,
                                                         onAddExample,
                                                         onRemoveExample,
                                                         onGenerateCaption,
                                                         modelConfig,
                                                         templates,
                                                         activeTemplate,
                                                         onTemplateChange,
                                                         onTemplateCreate,
                                                         onTemplateUpdate,
                                                         onTemplateDelete,
                                                     }) => {
    return (
        <div className="grid grid-cols-12 gap-6 px-6">
            {/* Left Panel: Configuration (4 cols) */}
            <div className="col-span-4 space-y-4">
                <PromptPanel
                    templates={templates}
                    activeTemplate={activeTemplate}
                    onTemplateChange={onTemplateChange}
                    onTemplateCreate={onTemplateCreate}
                    onTemplateUpdate={onTemplateUpdate}
                    onTemplateDelete={onTemplateDelete}
                />
                <ExamplesPanel
                    examples={examples}
                    onAddExample={onAddExample}
                    onRemoveExample={onRemoveExample}
                />
            </div>

            {/* Middle Panel: Test Generation (4 cols) */}
            <div className="col-span-4 space-y-4">
                <TestPanel
                    onGenerateCaption={onGenerateCaption}
                    modelConfig={modelConfig}
                />
            </div>

            {/* Right Panel: Preview (4 cols) */}
            <div className="col-span-4">
                <PreviewPanel
                    examples={examples}
                    activeTemplate={activeTemplate}
                    testImage={undefined} // We'll add this later when implementing test image persistence
                />
            </div>
        </div>
    );
};

export default GeneratorView;