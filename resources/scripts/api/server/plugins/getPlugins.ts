import http from '@/api/http';

export interface Plugin {
    id: string;
    name: string;
    version: string;
    description: string;
    downloadUrl: string;
    premium: boolean;
    rating: {
        count: number;
        average: number;
    };
    downloads: number;
    likes: number;
    icon?: {
        url: string;
        data: string;
    };
}

export default async (uuid: string, query: string): Promise<Plugin[]> => {
    try {
        const { data } = await http.post(`/api/client/servers/${uuid}/plugins`, {
            query,
        });

        console.log(data, 'from getplugin.ts');

        //transformer for plugins

        const plugins: Plugin[] = data.data.plugins.map((item: any) => ({
            id: String(item.id),
            name: String(item.name),
            version: String(item.version?.id || 'Unknown'),
            description: String(item.tag || ''),
            downloadUrl: String(item.file?.url || 'unknown'),
            premium: Boolean(item.premium),
            rating: {
                count: Number(item.rating?.count || 0),
                average: Number(item.rating?.average || 0),
            },
            downloads: Number(item.downloads || 0),
            likes: Number(item.likes || 0),
            links: item.links || [],
            icon: item.icon ? {
                url: String(item.icon.url || ''),
                data: String(item.icon.data || '')
            } : undefined
        }));

        return plugins;
    } catch (error) {
        console.error('Error fetching plugins from PluginController:', error);
        throw error;
    }
};