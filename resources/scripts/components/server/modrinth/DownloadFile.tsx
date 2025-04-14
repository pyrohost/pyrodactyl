import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';

interface DownloadProps {
    url: string;
    serverUuid: string;
    directory?: string;
}

const DownloadModrinth: React.FC<DownloadProps> = ({ url, serverUuid, directory = 'mods' }) => {
    const [progress, setProgress] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const downloadAndUploadFile = async () => {
        setLoading(true);
        try {
            toast.info('Downloading file from Modrinth...');

            // 1️⃣ Download the file from Modrinth
            const downloadResponse = await axios.get(url, {
                responseType: 'blob',
            });

            const fileName = url.split('/').pop() || 'modrinth-file.jar';
            const file = new Blob([downloadResponse.data], {
                type: downloadResponse.headers['content-type'] || 'application/java-archive',
            });

            // 2️⃣ Prepare FormData for Upload
            const formData = new FormData();
            formData.append('files', file, fileName);

            // 3️⃣ Upload to Pyrodactyl Server
            toast.info(`Uploading ${fileName} to server...`);
            await axios.post(`/api/client/servers/${serverUuid}/files/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                params: { directory: `/container/${directory}` },
                onUploadProgress: (event) => {
                    if (event.total) {
                        setProgress(Math.round((event.loaded * 100) / event.total));
                    }
                },
            });

            toast.success(`${fileName} uploaded successfully!`);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleError = (error: any) => {
        if (axios.isCancel(error)) {
            toast.warning('Request cancelled.');
        } else if (error.response) {
            toast.error(`Server error! Status: ${error.response.status}`);
        } else if (error.request) {
            toast.error('No response from server.');
        } else {
            toast.error(`Error: ${error.message}`);
        }
    };

    return (
        <div className='p-4'>
            <button
                onClick={downloadAndUploadFile}
                disabled={loading}
                className='px-4 py-2 bg-blue-500 text-white rounded-lg'
            >
                {loading ? 'Processing...' : 'Download & Upload'}
            </button>
            {progress > 0 && <p className='mt-2 text-sm'>Upload Progress: {progress}%</p>}
        </div>
    );
};

export default DownloadModrinth;
