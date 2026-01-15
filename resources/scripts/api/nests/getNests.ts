import http from '@/api/http';

interface Egg {
    object: string;
    attributes: {
        id: number;
        uuid: string;
        name: string;
        description: string;
    };
}

interface Nest {
    object: string;
    attributes: {
        id: number;
        uuid: string;
        author: string;
        name: string;
        description: string;
        created_at: string;
        updated_at: string;
        relationships: {
            eggs: {
                object: string;
                data: Egg[];
            };
        };
    };
}

export default (): Promise<Nest[]> => {
    return new Promise((resolve, reject) => {
        http.get('/api/client/nests')
            .then(({ data }) => resolve(data.data))
            .catch(reject);
    });
};
