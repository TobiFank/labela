// frontend/src/components/batch_processing/FolderSelect.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Folder } from 'lucide-react';
import { api } from '@/lib/api';

interface FolderSelectProps {
    currentFolder: string;
    onSelect: (folder: string) => void;
    onClose: () => void;
}

type FolderInfo = {
    name: string;
    path: string;
    image_count: number;
}

const FolderSelect: React.FC<FolderSelectProps> = ({
                                                       currentFolder,
                                                       onSelect,
                                                       onClose,
                                                   }) => {
    const [folders, setFolders] = useState<FolderInfo[]>([]);

    useEffect(() => {
        loadFolders();
    }, []);

    const loadFolders = async () => {
        try {
            const folderList = await api.getFolders();
            setFolders(folderList);
        } catch (error) {
            console.error('Failed to load folders:', error);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Select Source Folder</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        {folders.map((folder) => (
                            <div
                                key={folder.path}
                                className={`p-3 flex items-center justify-between rounded-lg cursor-pointer hover:bg-gray-100 ${
                                    currentFolder === folder.path ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => onSelect(folder.path)}
                            >
                                <div className="flex items-center gap-2">
                                    <Folder className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">{folder.name}</span>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {folder.image_count} images
                                </span>
                            </div>
                        ))}

                        {folders.length === 0 && (
                            <div className="text-center text-gray-500 py-4">
                                No folders found in data directory. Create folders manually in the data directory.
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FolderSelect;