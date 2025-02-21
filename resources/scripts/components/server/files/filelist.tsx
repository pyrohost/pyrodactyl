import { useState, useEffect } from 'react';
import {
  FileIcon,
  FolderIcon,
  LucideKeyRound,
  LucideFile,
  LucideBadgeInfo,
  ChevronRight,
  LucideFileText,
  LucideFileJson,
  LucideArchive,
  LucideLock,
  LucideMoreHorizontal,
  LucideCoffee,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import compressFiles from '@/api/server/files/compressFiles';
import decompressFiles from '@/api/server/files/decompressFiles';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter, DrawerDescription } from "@/components/ui/drawer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import loadDirectory from '@/api/server/files/loadDirectory';
import { router, usePage } from '@inertiajs/react';
import { FileButton } from './filebuttons';
import FileEditor from './FileEditor';
import LogoLoader from '@/components/elements/ServerLoad';
import renameFiles from '@/api/server/files/renameFiles';
import deleteFiles from '@/api/server/files/deleteFiles';
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
  } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TbZip } from 'react-icons/tb';
import { EyeOpenIcon } from '@radix-ui/react-icons';
import { useShellScriptDetection } from '@/hooks/Server/hasShellScript';
import { useFileCompression } from '@/hooks/Server/useFileCompression';

interface FileManagerProps {
    serverId: string;
}

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium'
    }).format(date);
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function FileManager({ serverId }: FileManagerProps) {
    
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState<{ name: string; isFile: boolean; key: string; mimetype?: string; size?: number; modifiedAt: string }[]>([]);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [fileToRename, setFileToRename] = useState("");
    const {toast} = useToast();
    const [newFileName, setNewFileName] = useState("");
    const { props } = usePage();
    // Add new state variables
const [isCompressDialogOpen, setIsCompressDialogOpen] = useState(false);
const [isDecompressDialogOpen, setIsDecompressDialogOpen] = useState(false);
const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    

    

    
    const [editingFile, setEditingFile] = useState<string | null>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('edit');
    });
    const [error, setError] = useState<string | null>(null);
    const [currentDirectory, setCurrentDirectory] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('dir') || '/';
    });
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const mimeTypeIcons = {
        'text/plain': LucideFileText,
        'application/jar': LucideCoffee,
        'default': LucideFile,
        'application/zip': LucideArchive,
        'application/x-tar': LucideArchive,
        'application/vnd.rar': LucideArchive,
        'application/x-rar-compressed': LucideArchive, 
        
        'application/x-br': LucideArchive,
        'application/x-bzip2': LucideArchive,
        'application/gzip': LucideArchive,
        'application/x-gzip': LucideArchive,
        'application/x-lzip': LucideArchive,
        'application/x-sz': LucideArchive,
        'application/x-xz': LucideArchive,
        'application/zstd': LucideArchive,
        
    };

    const handleFileClick = (file: any) => {
        if (!file.isFile) {
            navigateToDirectory(`${currentDirectory}/${file.name}`.replace(/\/+/g, '/'));
            return;
        }

        if (isEditable(file.mimetype)) {
            const editPath = `${currentDirectory}/${file.name}`.replace(/\/+/g, '/');
            router.visit(`?edit=${editPath}`);
            return;
        }

        setSelectedIndex(files.indexOf(file));
    };

    useShellScriptDetection(files, props.server, currentDirectory)
    

    if (editingFile) {
        return <FileEditor serverId={serverId} file={editingFile} />;
    }

    useEffect(() => {
        loadDirectory(serverId, currentDirectory)
          .then((data) => {
            // Convert modifiedAt to string format since FileObject has Date but state expects string
            const formattedData = data.map(file => ({
              ...file,
              modifiedAt: new Date(file.modifiedAt).toISOString()
            }));
            setFiles(formattedData);
          })
          .catch(() => {
            toast({
              title: "Error",
              description: "Failed to load directory contents (FileManager)",
              variant: "destructive",
            });
          });
    }, [serverId, currentDirectory]);
    
    const handleRename = async () => {
        try {
          await renameFiles(serverId, currentDirectory, [{ from: fileToRename, to: newFileName }]);
          // Instead of fetching the file list manually, refresh the entire page.
          window.location.reload();
        } catch (error) {
          console.error("Rename failed:", error);
        } finally {
          setIsRenameDialogOpen(false);
        }
      };
    
    const handleDelete = (fileName: string) => {
        if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
          deleteFiles(serverId, currentDirectory, [fileName])
            .then(async () => {
                window.location.reload();
            })
            .catch(() => { /* handle error */ });
        }
    };

    // Add new functions for compressing and decompressing files

    const { handleCompress, handleDecompress } = useFileCompression(serverId, currentDirectory) 


    const isEditable = (mimetype: string | undefined) => {
        if (!mimetype) {
            toast({
                title: "Unknow file type!",
                description: "mimetype is undefined",
                variant: "destructive",
            });
            console.debug('🔍 isEditable check - mimetype is undefined');
            return false;
        }
        
        const matches = ['application/jar', 'application/octet-stream', 'inode/directory', /^image\/(?!svg\+xml)/];
        const result = matches.every((m) => !mimetype.match(m));
        
        console.debug(`🔍 isEditable check - mimetype: ${mimetype}, result: ${result}`);
        return result;
    };
    
    const getFileIcon = (file: { mimetype?: string, isFile: boolean }) => {
        if (!isEditable(file.mimetype)) {
            return <LucideLock className="h-5 w-5 text-gray-500" />;
        }
    
        if (file.mimetype?.startsWith('text/plain')) {
            return <LucideFileText className="h-5 w-5 text-green-500" />;
        }
        
        for (const [type, IconComponent] of Object.entries(mimeTypeIcons)) {
            if (file.mimetype?.includes(type)) {
                return <IconComponent className="h-5 w-5" />;
            }
        }
        
        return <LucideFile className="h-5 w-5" />;
    };

    const navigateToDirectory = (newPath: string) => {
        setCurrentDirectory(newPath);
        router.get(
            window.location.pathname,
            { dir: newPath },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(0, prev - 1));
                break;
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(files.length - 1, prev + 1));
                break;
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown as any);
        return () => document.removeEventListener('keydown', handleKeyDown as any);
    }, [files.length]);

    const fetchFiles = async (path: string = '/') => {
        try {
            setLoading(true);
            const updatedFiles = await loadDirectory(serverId, path);
            setFiles(updatedFiles.sort((a, b) => {
                if (!a.isFile && b.isFile) return -1;
                if (a.isFile && !b.isFile) return 1;
                return a.name.localeCompare(b.name);
            }));
        } catch (err) {
            setError('Failed to load directory contents');
            console.error('Error loading directory:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles(currentDirectory);
    }, [serverId, currentDirectory]);

    if (loading) {
        return (
            <div className="p-6 w-full">
                <div className="items-center justify-center flex h-full w-full animate-bounce">
                    <LogoLoader size="160px"/>
                </div>
            </div>
        );
    }

    const FileActions = ({ file }: { file: FileObject }) => {
        return (
            <div className="flex space-x-2">
                {/* Existing actions */}
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


    //later move to transformer 
    // const isEditable = file?.mimetype && typeof file?.isFile !== 'undefined' 
    //? FileTransformers.isEditable(file.mimetype, file.isFile)
    //: false;

    const pathParts = currentDirectory === '/' ? [] : currentDirectory.split('/').filter(Boolean);

    return (
        <div className="p-6 w-full" tabIndex={0}>
            <div className="mb-6 bg-accent/30 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 flex-wrap">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer
                            ${currentDirectory === '/' ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}
                        onClick={() => navigateToDirectory('/')}
                    >
                        <FolderIcon className="h-4 w-4" />
                        <span className="font-medium">root</span>
                    </motion.div>
                    {pathParts.map((part, index) => (
                        <div key={index} className="flex items-center">
                            <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`inline-flex items-center px-3 py-1.5 rounded-md cursor-pointer
                                    ${index === pathParts.length - 1 ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}
                                onClick={() => navigateToDirectory('/' + pathParts.slice(0, index + 1).join('/'))}
                            >
                                <span className="font-medium">{part}</span>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>
            
            <FileButton 
                currentDirectory={currentDirectory} 
                onDirectoryCreate={() => fetchFiles(currentDirectory)}
            />



            <motion.div 
                className="grid grid-cols-1 gap-3 mt-4"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {files.map((file, index) => (
                    <motion.div key={file.key} variants={item}>
                        <Card 
                            className={`
                                group p-4 cursor-pointer transition-all duration-200 
                                hover:shadow-lg hover:translate-x-1
                                ${index === selectedIndex ? 
                                    'bg-accent/80 ring-2 ring-primary shadow-lg' : 
                                    'hover:bg-accent/40 bg-background/60'
                                }
                            `}
                            onClick={() => handleFileClick(file)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <motion.div
                                        whileHover={{ rotate: 15, scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 400 }}
                                        className="p-2 rounded-md bg-accent/50"
                                    >
                                        {file.isFile ? getFileIcon(file) : (
                                            <FolderIcon className="h-5 w-5 text-blue-500" />
                                        )}
                                    </motion.div>
                                    <div>
                                        <p className="font-medium">{file.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {file.isFile ? formatFileSize(file.size!) : 'Click to open this directory'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(new Date(file.modifiedAt))}
                                    </p>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <LucideMoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFileToRename(file.name);
                                                    setNewFileName(file.name);
                                                    setIsRenameDialogOpen(true);
                                                }}
                                            >
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCompress(file.name);
                                                }}
                                            >
                                                Compress
                                            </DropdownMenuItem> 

                                                                                {file.isFile && (
                                                file.mimetype?.match(/^application\/(x-rar-compressed|vnd\.rar|x-tar|x-br|x-bzip2|gzip|x-gzip|x-lzip|x-sz|x-xz|zstd|zip)$/) && 
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDecompress(file.name);
                                                    }}
                                                >
                                                    Decompress
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(file.name);
                                                }}
                                            >
                                                Delete
                                            </DropdownMenuItem>

                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            <Drawer open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
  <DrawerContent>
    <div className="mx-auto px-4 max-w-2xl w-full">
      <div className="flex flex-col items-center space-y-6 py-4">
        <DrawerHeader className="items-center space-y-2">
          <DrawerTitle className="text-xl font-semibold">Rename File</DrawerTitle>
        </DrawerHeader>
        <div className="w-[450px]">
          <Input 
            className="w-full"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="Enter new file name"
          />
        </div>
      </div>
      <DrawerFooter className="sm:justify-center gap-2">
        <div className="flex gap-2 justify-center">
          <Button 
            className="w-32"
            onClick={handleRename}
            disabled={!newFileName.trim()}
          >
            Rename
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-32" onClick={() => window.location.reload()}>
              Cancel
            </Button>
          </DrawerClose>
        </div>
      </DrawerFooter>
    </div>
  </DrawerContent>
</Drawer>
        </div>
    );
}