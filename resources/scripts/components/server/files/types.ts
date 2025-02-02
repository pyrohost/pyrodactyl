export interface FileItem {
    name: string;
    isFile: boolean;
    key: string;
    mimetype?: string;
    size?: number;
    modifiedAt: string;
}

export interface FileOperationProps {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}