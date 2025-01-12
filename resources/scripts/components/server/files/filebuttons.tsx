import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import createDirectory from "@/api/server/files/createDirectory";
import saveFileContents from "@/api/server/files/saveFileContents"
import { router, usePage } from '@inertiajs/react';
import { Textarea } from "@/components/ui/textarea";

import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter, DrawerDescription } from "@/components/ui/drawer"
import { useToast } from "@/hooks/use-toast";

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
  const { props } = usePage();
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false)
  const { toast } = useToast()
  const serverId = props.server.uuid;
  
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
    <DrawerContent>
      
      <div className="flex flex-col items-center space-y-6 py-4">
      <DrawerHeader className="items-center space-y-2">
        <DrawerTitle className="text-xl font-semibold">Create New Folder</DrawerTitle>
        
      </DrawerHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md w-[450px]">
            <span className="font-mono">
              Location: root{currentDir === '/' ? '/' : currentDir + '/'}{dirName || '<folder name>'}
            </span>
          </div>
          
          <Input
            className="w-[450px]"
            placeholder="Enter folder name"
            value={dirName}
            onChange={(e) => setDirName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <DrawerFooter className="sm:justify-center gap-2">
          <div className="flex gap-2 justify-center">
            <Button 
              className="w-32"
              onClick={handleCreate}
              disabled={!dirName.trim() || isLoading}
            >
              Create Folder
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

    <Drawer open={isCreateFileOpen} onOpenChange={setIsCreateFileOpen}>
  <DrawerTrigger asChild>
    <Button variant="default" size="sm">
      Create File
    </Button>
  </DrawerTrigger>
  <DrawerContent>
    <div className="mx-auto px-4 max-w-2xl w-full">
      
      
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


    </div>
    
    </>

    
  );
}