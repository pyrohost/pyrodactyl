import { LucideFileText, LucideFileJson, LucideFile, LucideArchive } from 'lucide-react'

export const MIME_TYPES = {
    ARCHIVE: [
        'application/vnd.rar',
        'application/x-rar-compressed',
        'application/x-tar',
        'application/x-br',
        'application/x-bzip2',
        'application/gzip',
        'application/x-gzip',
        'application/x-lzip',
        'application/x-sz',
        'application/x-xz',
        'application/zstd',
        'application/zip',
    ],
    NON_EDITABLE: [
        'application/jar',
        'application/octet-stream',
        'inode/directory',
        /^image\/(?!svg\+xml)/,
    ]
}

export const MIME_TYPE_ICONS = {
    'text/plain': LucideFileText,
    'application/jar': LucideFileJson,
    'application/zip': LucideArchive,
    'application/x-tar': LucideArchive,
    'default': LucideFile,
} as const

export const FileTransformers = {
    isArchiveType: (mimetype: string): boolean => {
        return MIME_TYPES.ARCHIVE.includes(mimetype)
    },

    isEditable: (mimetype?: string | null, isFile?: boolean): boolean => {
        // Return false if required properties are missing
        if (!mimetype || typeof isFile === 'undefined') return false;

        if (!isFile || FileTransformers.isArchiveType(mimetype)) return false;
        
        return !MIME_TYPES.NON_EDITABLE.some(m => 
            m instanceof RegExp ? mimetype.match(m) : mimetype === m
        )
    },

    getIcon: (mimetype: string) => {
        return MIME_TYPE_ICONS[mimetype as keyof typeof MIME_TYPE_ICONS] || MIME_TYPE_ICONS.default
    }
}