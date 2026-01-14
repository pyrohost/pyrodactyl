import http from '@/api/http';
import { FileObject } from '@/api/server/files/loadDirectory';
import { getGlobalDaemonType } from '@/api/server/getServer';
import { rawDataToFileObject } from '@/api/transformers';

export default async (uuid: string, directory: string, files: string[]): Promise<FileObject> => {
    const { data } = await http.post(
        `/api/client/servers/${getGlobalDaemonType()}/${uuid}/files/compress`,
        { root: directory, files },
        {
            timeout: 60000,
            timeoutErrorMessage:
                'It looks like this archive is taking a long time to generate. It will appear once completed.',
        },
    );

    return rawDataToFileObject(data);
};
