// frontend/src/components/settings/tabs/ModelSettings.tsx
// frontend/src/components/settings/tabs/ModelSettings.tsx
import React from 'react';
import {ModelConfig} from '@/lib/types';
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Card, CardContent} from "@/components/ui/card";
import {Slider} from "@/components/ui/slider";

interface ModelSettingsProps {
    config: ModelConfig;
    onUpdate: (config: Partial<ModelConfig>) => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({
                                                         config,
                                                         onUpdate,
                                                     }) => {
    const handleChange = (key: keyof ModelConfig, value: string | number) => {
        onUpdate({
            ...config,
            [key]: value
        });
    };

    // Calculate example cost for a typical request
    const calculateExampleCost = () => {
        const typicalTokens = 1000; // Example: system prompt + template + 2 examples + images
        return (config.costPerToken * typicalTokens / 1000).toFixed(4);
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
                        <SelectItem value="huggingface">HuggingFace</SelectItem>
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
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
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
                    Your API key is stored securely
                </p>
            </div>

            {/* Cost per token */}
            <div className="space-y-2">
                <Label>
                    Cost per 1K tokens ($)
                    <span
                        title="Visit OpenAI API Pricing page for more details"
                        className="ml-2 text-blue-500 cursor-pointer"
                        onClick={() => window.open('https://openai.com/api/pricing/', '_blank')}
                    >
            ℹ️
        </span>
                </Label>
                <Input
                    type="number"
                    value={config.costPerToken}
                    onChange={(e) => handleChange('costPerToken', parseFloat(e.target.value))}
                    step="0.001"
                    min="0"
                />
                <p className="text-xs text-gray-500">
                    Cost per 1,000 tokens for the selected model
                </p>
            </div>


            {/* Temperature Control */}
            <div className="space-y-2">
                <Label>Temperature</Label>
                <div className="flex items-center gap-4">
                    <Slider
                        value={[config.temperature]}
                        onValueChange={(value) => handleChange('temperature', value[0])}
                        min={0}
                        max={1}
                        step={0.1}
                        className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                        {config.temperature.toFixed(1)}
                    </span>
                </div>
                <p className="text-xs text-gray-500">
                    Lower values make the output more focused and deterministic
                </p>
            </div>

            {/* Cost Preview */}
            <Card>
                <CardContent className="p-4">
                    <div className="space-y-4">
                        <div className="text-sm">
                            <p className="text-gray-600">Example cost calculation</p>
                            <p className="font-medium">
                                Typical request (~1000 tokens): ${calculateExampleCost()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Includes system prompt, template, examples, and images
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ModelSettings;