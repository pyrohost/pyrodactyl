import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import createDirectory from "@/api/server/files/createDirectory";
import saveFileContents from "@/api/server/files/saveFileContents"
import { router, usePage } from '@inertiajs/react';
import { Textarea } from "@/components/ui/textarea";
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';

import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter, DrawerDescription } from "@/components/ui/drawer"
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/elements/Spinner";
import { LucideFolder, LucideLoader2 } from "lucide-react";
import axios from 'axios';

interface Props {
  currentDirectory: string;
  onDirectoryCreate?: () => void;
}

export function FileButton({ currentDirectory, onDirectoryCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [dirName, setDirName] = useState("");
  const [openFile, setOpenFile] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { props } = usePage();
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false)
  const { toast } = useToast()
  const serverId = props.server.uuid;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const params = new URLSearchParams(window.location.search);
  const currentDir = params.get('dir') || '/';

  const handleCreateFile = async () => {
    try {
      setIsLoading(true);
      await saveFileContents(serverId, `${currentDir}/${fileName}`, fileContent);
      toast({
        title: "Success",
        description: "File created successfully",
      });
      setIsCreateFileOpen(false);
      setFileName('');
      setFileContent('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Uploading FILES 

  // Handlers for drag & drop events
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files?.length) {
      onFileSubmission(event.dataTransfer.files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  //Paste lisenter 

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (event.clipboardData?.files?.length) {
        event.preventDefault();
        onFileSubmission(event.clipboardData.files);
      }
    };

    if (isUploadOpen) {
      window.addEventListener("paste", handlePaste);
    }
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isUploadOpen]);

  const onFileSubmission = async (files: FileList) => {
    // Clear previous errors if any...
    const fileArray = Array.from(files);
    if (fileArray.some((file) => !file.size || (!file.type && file.size === 4096))) {
      toast({
        title: "Error",
        description: "Folder uploads are not supported at this time.",
        variant: "destructive",
      });
      return;
    }

    fileArray.forEach(async (file) => {
      const controller = new AbortController();
      try {
        const url = await getFileUploadUrl(serverId);
        await axios.post(
          url,
          { files: file },
          {
            signal: controller.signal,
            headers: { 'Content-Type': 'multipart/form-data' },
            params: { directory: currentDirectory },
          }
        );
        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    });
  };


  

  const handleCreate = async () => {
    if (!dirName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }
    
    setIsLoading(true);
    try {
      await createDirectory(
        serverId, 
        currentDir,
        dirName.trim()
      );
      
      setDirName("");
      setOpen(false);
      toast.success('Folder created successfully');
      
      // Refresh the page with new directory
      router.get(window.location.pathname, {
        dir: currentDir
      }, {
        preserveState: true,
        preserveScroll: true
      });
      
      onDirectoryCreate?.();
    } catch (error) {
      console.error('Failed to create directory:', error);
      toast.error('Failed to create folder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  return (
    <>
    <div className="flex items-center justify-end gap-2">


    <Drawer open={open} onOpenChange={setOpen}>
  <DrawerTrigger asChild>
    <Button variant="default" size="sm">
      Create Folder
    </Button>
  </DrawerTrigger>
  <DrawerContent className="max-w-md">
    <div className="px-6 py-8">
      <DrawerHeader className="mb-6 text-center">
        <DrawerTitle className="text-2xl font-medium tracking-tight">
          Create New Folder
        </DrawerTitle>
      </DrawerHeader>
      
      <div className="space-y-6">
        {/* Location display */}
        <div className="rounded-lg bg-secondary/10 p-4">
          <div className="flex items-center gap-2 text-sm text-secondary-foreground">
            <LucideFolder className="h-4 w-4" />
            <span className="font-mono">
              {currentDir === '/' ? '/' : currentDir + '/'}{dirName || '...'}
            </span>
          </div>
        </div>

        {/* Input field */}
        <div className="space-y-2">
          <label htmlFor="folderName" className="text-sm font-medium">
            Folder Name
          </label>
          <input
            id="folderName"
            type="text"
            value={dirName}
            onChange={(e) => setDirName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter folder name..."
          />
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LucideLoader2 className="h-4 w-4" /> Creating...
              </span>
            ) : 'Create Folder'}
          </Button>
        </div>
      </div>
    </div>
  </DrawerContent>
</Drawer>

    <Drawer open={isCreateFileOpen} onOpenChange={setIsCreateFileOpen}>
  <DrawerTrigger asChild>
    <Button variant="default" size="sm">
      Create File
    </Button>
  </DrawerTrigger>
  <DrawerContent>
    <div className="mx-auto px-4  w-full">
      
      
      <div className="flex flex-col items-center space-y-6 py-4">
      <DrawerHeader className="items-center space-y-2">
        <DrawerTitle className="text-xl font-semibold">Create New File</DrawerTitle>
        
      </DrawerHeader>
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md w-[450px]">
        
          <span className="font-mono">
            Location: root{currentDir === '/' ? '/' : currentDir + '/'}{fileName || '<filename>'}
          </span>
        </div>
        
        <Input
          className="w-[450px]"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="Enter file name"
          onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
        />
        
        <Textarea
          className="w-[450px] min-h-[200px]"
          value={fileContent}
          onChange={(e) => setFileContent(e.target.value)}
          placeholder="Enter file content (optional)"
        />
      </div>

      <DrawerFooter className="sm:justify-center gap-2">
        <div className="flex gap-2 justify-center">
          <Button 
            className="w-32"
            onClick={handleCreateFile}
            disabled={!fileName.trim() || isLoading}
          >
            Create File
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-32">
              Cancel
            </Button>
          </DrawerClose>
        </div>
      </DrawerFooter>
    </div>
  </DrawerContent>
</Drawer>



<Button onClick={() => setIsUploadOpen(true)}>Upload File</Button>

<Drawer open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DrawerContent className="flex flex-col items-center">
          <DrawerHeader>
            <DrawerTitle className="text-center">Upload File</DrawerTitle>
          </DrawerHeader>
          <div className="w-1/3 flex flex-col items-center space-y-4 mt-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="w-full h-1/3 border-2 border-dashed border-gray-300 p-6 text-center"
            >
              Drag and drop your files here or press Cmd+V to paste
            </div>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              Choose File
            </Button>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) onFileSubmission(e.target.files);
              }}
            />
          </div>
          <DrawerFooter className="flex justify-center w-full mt-4">
            <Button onClick={() => setIsUploadOpen(false)}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

    </div>
    
    </>

    
  );
}