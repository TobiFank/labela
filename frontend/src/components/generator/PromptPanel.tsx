// frontend/src/components/generator/PromptPanel.tsx
import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Edit, Plus, Trash2} from 'lucide-react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {PromptTemplate} from '@/lib/types';
import PromptTemplateModal from "@/components/generator/PromptTemplateModal";

interface PromptPanelProps {
    templates: PromptTemplate[];
    activeTemplate: PromptTemplate;
    onTemplateChange: (template: PromptTemplate) => void;
    onTemplateCreate: (template: PromptTemplate) => void;
    onTemplateUpdate: (template: PromptTemplate) => void;
    onTemplateDelete: (templateId: string) => void;
}

const PromptPanel: React.FC<PromptPanelProps> = ({
                                                     templates,
                                                     activeTemplate,
                                                     onTemplateChange,
                                                     onTemplateCreate,
                                                     onTemplateUpdate,
                                                     onTemplateDelete
                                                 }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);

    const handleEdit = () => {
        setEditingTemplate(activeTemplate);
        setIsEditing(true);
    };

    const handleCreate = () => {
        setEditingTemplate({
            id: '',
            name: 'New Template',
            content: '',
            isDefault: false,
        });
        setIsEditing(true);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <div className="flex-1">
                        <Select
                            value={activeTemplate.id}
                            onValueChange={(value) => {
                                const template = templates.find(t => t.id === value);
                                if (template) onTemplateChange(template);
                            }}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select template"/>
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(template => (
                                    <SelectItem key={template.id} value={template.id}>
                                        {template.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreate}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <Plus className="w-4 h-4"/>
                        </button>
                        <button
                            onClick={handleEdit}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <Edit className="w-4 h-4"/>
                        </button>
                        {!activeTemplate.isDefault && (
                            <button
                                onClick={() => onTemplateDelete(activeTemplate.id)}
                                className="p-1 hover:bg-gray-100 rounded text-red-600"
                            >
                                <Trash2 className="w-4 h-4"/>
                            </button>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">{activeTemplate.name}</p>
                    <p className="text-gray-500 mt-2">{activeTemplate.content}</p>
                </div>
            </CardContent>

            {isEditing && (
                <PromptTemplateModal
                    template={editingTemplate}
                    onSave={(template) => {
                        if (template.id === '') {
                            onTemplateCreate(template);
                        } else {
                            onTemplateUpdate(template);
                        }
                        setIsEditing(false);
                    }}
                    onClose={() => setIsEditing(false)}
                />
            )}
        </Card>
    );
};

export default PromptPanel;