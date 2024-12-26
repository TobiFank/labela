// frontend/src/components/shared/Navigation.tsx
import React from 'react';
import {Settings} from 'lucide-react';

interface NavigationProps {
    currentView: 'generator' | 'batch';
    onViewChange: (view: 'generator' | 'batch') => void;
    onSettingsClick: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
                                                   currentView,
                                                   onViewChange,
                                                   onSettingsClick,
                                               }) => {
    return (
        <div className="border-b border-gray-200 mb-6">
            <div className="flex justify-between items-center px-6 py-4">
                <div className="flex space-x-4">
                    <button
                        className={`px-4 py-2 rounded-lg ${
                            currentView === 'generator'
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        onClick={() => onViewChange('generator')}
                    >
                        Test View
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg ${
                            currentView === 'batch'
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        onClick={() => onViewChange('batch')}
                    >
                        Batch Processing
                    </button>
                </div>
                <button
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    onClick={onSettingsClick}
                >
                    <Settings className="w-5 h-5 text-gray-600"/>
                </button>
            </div>
        </div>
    );
};

export default Navigation;