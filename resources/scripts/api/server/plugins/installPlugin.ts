import http from '@/api/http';

interface UploadResponse {
    object: 'signed_url';
    attributes: {
        url: string;
    };
}

export default async (uuid: string, plugin: { id: string; name: string }): Promise<void> => {
    try {
        // 1. Get upload URL from panel
        const { data } = await http.get<{ data: UploadResponse }>(
            `/api/client/servers/${uuid}/files/upload`,
            { params: { directory: '/plugins' } }
        );

        // 2. Download directly from CDN URL
        const cdnUrl = `https://cdn.spiget.org/file/spiget-resources/${plugin.id}.jar`;
        const response = await fetch(cdnUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to download plugin: ${response.statusText}`);
        }

        const pluginBlob = await response.blob();

        // 3. Upload to panel
        const formData = new FormData();
        formData.append('files', pluginBlob, `${plugin.name}.jar`);

        const urlWithParams = new URL(data.attributes.url);
        urlWithParams.searchParams.append('directory', '/plugins');

        await fetch(urlWithParams.toString(), {
            method: 'POST',
            body: formData
        });
    } catch (error) {
        console.error('Failed to install plugin:', error);
        throw error;
    }
};