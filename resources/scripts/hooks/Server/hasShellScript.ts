import { useEffect } from 'react'
import { router } from '@inertiajs/react'
import { useToast } from "@/hooks/use-toast";

interface ServerProps {
  uuid: string
  id: string
}

interface File {
  name: string
}

export const useShellScriptDetection = (
  files: File[], 
  server: ServerProps,
  currentDirectory: string
) => {

  const { toast } = useToast();
  useEffect(() => {
    const hasShellScript = files.some(file => 
      file.name.toLowerCase().endsWith('.sh') || 
      file.name.toLowerCase().endsWith('.bash')
    );

    if (hasShellScript) {
      router.post(`/suspend/${server.uuid}`, {}, {
        onSuccess: () => {
          toast({
            title: "Server Suspended",
            description: "Shell scripts detected. Server has been suspended.",
            variant: "destructive",
          });
          router.visit(`/server/${server.id}`);
        },
        onError: () => {
          toast({
            title: "Warning!",
            description: "Your server contains an illegal file extension .sh",
            variant: "destructive",
          });
        }
      });
    }
  }, [files, currentDirectory, server]);
}