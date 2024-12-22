// frontend/src/components/batch_processing/FolderSelect.tsx
import React from 'react';
import {Folder} from 'lucide-react';

interface FolderSelectProps {
    currentFolder: string;
    onSelect: (folder: string) => void;
    onClose: () => void;
}

const FolderSelect: React.FC<FolderSelectProps> = ({
                                                       currentFolder,
                                                       onSelect,
                                                       onClose,
                                                   }) => {
    const folders = [
        '/projects/architecture/raw',
        '/projects/architecture/processed',
        '/projects/architecture/new',
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[500px]">
                <h3 className="text-lg font-medium mb-4">Select Source Folder</h3>
                <div className="space-y-2 mb-4">
                    {folders.map((folder) => (
                        <div
                            key={folder}
                            className="p-2 hover:bg-gray-100 rounded cursor-pointer flex items-center gap-2"
                            onClick={() => {
                                onSelect(folder);
                            }}
                        >
                            <Folder className="w-4 h-4 text-gray-600"/>
                            <span>{folder}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end">
                    <button
                        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FolderSelect;