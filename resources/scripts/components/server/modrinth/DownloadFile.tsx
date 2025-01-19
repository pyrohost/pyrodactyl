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

    const downloadAndUploadFile = async () => {
        try {
            // Download the file
            const downloadResponse = await axios({
                method: 'GET',
                url: url,
                responseType: 'blob',
            });

            const fileName = url.split('/').pop();
            const file = new Blob([downloadResponse.data], {
                type: downloadResponse.headers['content-type'],
            });

            const formData = new FormData();
            formData.append('files', file, fileName);

            // Upload the file
            const uploadResponse = await axios.post(`/api/client/servers/${serverUuid}/files/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                params: {
                    directory: `/container/${directory}`,
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                },
            });

            toast.success('File uploaded successfully!');
            return uploadResponse.data;
        } catch (error) {
            handleError(error);
        }
    };

    const handleError = (error: any) => {
        if (axios.isCancel(error)) {
            console.log('Request cancelled:', error.message);
        } else if (error.response) {
            toast.error(`Server error! Status: ${error.response.status}`);
            console.error(`Server error! Status: ${error.response.status}`);
        } else if (error.request) {
            toast.error('No response received from server.');
            console.error('No response received from server.', error.request);
        } else {
            toast.error(`Error: ${error.message}`);
            console.error(`Error: ${error.message}`);
        }
    };

    return (
        <div>
            <button onClick={downloadAndUploadFile}>Download & Upload File</button>
            {progress > 0 && <p>Upload Progress: {progress}%</p>}
        </div>
    );
};

export default DownloadModrinth;
