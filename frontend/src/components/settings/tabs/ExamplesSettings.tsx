// frontend/src/components/settings/tabs/ExamplesSettings.tsx
import React from 'react';
import {Trash2, Upload} from 'lucide-react';

const ExamplesSettings: React.FC = () => {
    return (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2"/>
                <p className="text-sm text-gray-600">
                    Drop example pairs or select files
                </p>
            </div>

            <div className="space-y-2">
                {/* Example Item */}
                <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
                            {/* Example image would go here */}
                        </div>
                        <div className="flex-grow">
                            <p className="text-xs text-gray-500 mb-1">example1.jpg</p>
                            <p className="text-sm text-gray-600">
                                A modern glass office building with geometric patterns...
                            </p>
                        </div>
                        <button className="p-1 hover:bg-gray-200 rounded-full">
                            <Trash2 className="w-4 h-4 text-gray-500"/>
                        </button>
                    </div>
                </div>

                {/* You could map through examples here */}
                {/* Additional example items would go here */}
            </div>
        </div>
    );
};

export default ExamplesSettings;