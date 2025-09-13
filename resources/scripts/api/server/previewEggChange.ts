import http from '@/api/http';

export interface EggPreview {
    egg: {
        id: number;
        name: string;
        description: string;
        startup: string;
    };
    variables: Array<{
        id: number;
        name: string;
        description: string;
        env_variable: string;
        default_value: string;
        user_viewable: boolean;
        user_editable: boolean;
        rules: string;
    }>;
    docker_images: Record<string, string>;
    default_docker_image: string | null;
    warnings?: Array<{
        type: string;
        message: string;
        severity: string;
    }>;
}

/**
 * Preview egg configuration changes before applying them.
 * Returns egg details, variables, and available Docker images.
 */
export default async (uuid: string, eggId: number, nestId: number): Promise<EggPreview> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/settings/egg/preview`, {
        egg_id: eggId,
        nest_id: nestId,
    });

    return data;
};
