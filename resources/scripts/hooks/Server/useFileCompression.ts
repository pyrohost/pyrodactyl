import { useToast } from "@/hooks/use-toast";
import compressFiles from '@/api/server/files/compressFiles';
import decompressFiles from '@/api/server/files/decompressFiles';



export const useFileCompression = (serverId: string, currentDirectory: string) => {

    const { toast } = useToast()

    const handleCompress = async (fileName: string) => {
        try {
            const response = await compressFiles(serverId, currentDirectory, [fileName])
            if (response.status === 204 || response.ok) {
                toast({
                    title: "Success",
                    description: "File compressed successfully",
                    variant: "default",
                })
                window.location.reload()
            }
        } catch (error) {
            toast({
                title: "Error", 
                description: "Failed to compress file",
                variant: "destructive",
            })
            console.error("Compression failed:", error)
        }
    }

    const handleDecompress = async (fileName: string) => {
        try {
            const response = await decompressFiles(serverId, currentDirectory, fileName)
            if (response.ok) {
                toast({
                    title: "Success",
                    description: "File decompressed successfully",
                    variant: "default",
                })
                window.location.reload()
            }
        } catch (error) {
            toast({
                title: "Successfully added task!",
                description: "Your server will be decompressed fully shortly!",
                variant: "default",
            })
            window.location.reload()
            console.error("Decompression failed:", error)
        }
    }

    return { handleCompress, handleDecompress }
}