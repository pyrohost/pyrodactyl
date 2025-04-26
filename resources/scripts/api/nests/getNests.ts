import axios from 'axios';

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
    return axios
        .get('/api/client/nests')
        .then(({ data }) => data.data)
        .catch((error) => {
            throw error;
        });
};
