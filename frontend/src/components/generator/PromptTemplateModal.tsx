// frontend/src/components/generator/PromptTemplateModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PromptTemplate } from '@/lib/types';

interface PromptTemplateModalProps {
    template: PromptTemplate | null;
    onSave: (template: PromptTemplate) => void;
    onClose: () => void;
}

const PromptTemplateModal: React.FC<PromptTemplateModalProps> = ({
                                                                     template,
                                                                     onSave,
                                                                     onClose,
                                                                 }) => {
    const [name, setName] = useState(template?.name || '');
    const [content, setContent] = useState(template?.content || '');

    const handleSave = () => {
        const templateToSave: PromptTemplate = {
            id: template?.id || '',
            name,
            content,
            isDefault: template?.isDefault || false
        };
        onSave(templateToSave);
        onClose();
    };

    return (
        <Dialog open onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>
                        {template?.id ? 'Edit Template' : 'Create New Template'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Template Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter template name"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Template Content</label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter prompt template content..."
                            className="min-h-[200px] font-mono"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!name || !content}>
                        Save Template
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PromptTemplateModal;