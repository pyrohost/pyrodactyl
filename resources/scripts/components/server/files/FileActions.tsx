import React from 'react';
import { EyeOpenIcon } from '@radix-ui/react-icons';
import { TbZip } from 'react-icons/tb';
import { FileObject } from '@/types'; // Adjust the import path as necessary

interface FileActionsProps {
    file: FileObject;
    setIsDecompressDialogOpen: (open: boolean) => void;
    setIsCompressDialogOpen: (open: boolean) => void;
    setSelectedFiles: (files: string[]) => void;
}

const FileActions: React.FC<FileActionsProps> = ({ file, setIsDecompressDialogOpen, setIsCompressDialogOpen, setSelectedFiles }) => {
    return (
        <div className="flex space-x-2">
            {file.isFile && file.mimetype?.includes('compressed') && (
                <button
                    onClick={() => {
                        setIsDecompressDialogOpen(true);
                        setSelectedFiles([file.name]);
                    }}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <EyeOpenIcon className="h-5 w-5" />
                </button>
            )}
            <button
                onClick={() => {
                    setIsCompressDialogOpen(true);
                    setSelectedFiles([file.name]);
                }}
                className="text-gray-600 hover:text-gray-900"
            >
                <TbZip className="h-5 w-5" />
            </button>
        </div>
    );
};

export default FileActions;