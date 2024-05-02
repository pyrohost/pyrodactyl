// get eggs
import http from '@/api/http';

interface Basket {
    [key: string]: boolean;
}

export default (): Promise<Basket> => {
    return new Promise((resolve, reject) => {
        http.get('/api/client/eggs')
            .then(({ data }) => console.log(data))
            .catch(reject);
    });
};
