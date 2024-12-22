// frontend/src/components/settings/tabs/ModelSettings.tsx
import React from 'react';
import {ModelConfig} from '@/lib/types';
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Card, CardContent} from "@/components/ui/card";

interface ModelSettingsProps {
    config: ModelConfig;
    onUpdate: (config: Partial<ModelConfig>) => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({
                                                         config,
                                                         onUpdate,
                                                     }) => {
    const handleChange = (key: keyof ModelConfig, value: any) => {
        onUpdate({[key]: value});
    };

    return (
        <div className="space-y-6">
            {/* Provider Selection */}
            <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                    value={config.provider}
                    onValueChange={(value) => handleChange('provider', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select provider"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
                <Label>Model</Label>
                <Select
                    value={config.model}
                    onValueChange={(value) => handleChange('model', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select model"/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gpt-4-vision-preview">GPT-4 Vision</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* API Key */}
            <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => handleChange('apiKey', e.target.value)}
                    placeholder="Enter your API key"
                    className="font-mono"
                />
                <p className="text-xs text-gray-500">
                    Your API key is stored securely in your browser
                </p>
            </div>

            {/* Cost Settings */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Cost per 1K tokens ($)</Label>
                    <Input
                        type="number"
                        value={config.costPerToken}
                        onChange={(e) => handleChange('costPerToken', parseFloat(e.target.value))}
                        step="0.001"
                        min="0"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Max tokens</Label>
                    <Input
                        type="number"
                        value={config.maxTokens}
                        onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                        min="1"
                    />
                </div>
            </div>

            {/* Cost Preview */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-sm">
                            <p className="text-gray-600">Estimated cost per image</p>
                            <p className="font-medium">
                                ${(config.costPerToken * config.maxTokens / 1000).toFixed(4)}
                            </p>
                        </div>
                        <div className="text-sm">
                            <p className="text-gray-600">Selected Model</p>
                            <p className="font-medium">{config.model}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ModelSettings;