import http from '@/api/http';

interface Data {
    token: string;
    password: string;
    passwordConfirmation: string;
    [key: string]: string;
}

interface PasswordResetResponse {
    redirectTo?: string | null;
    sendToLogin: boolean;
}

export default (email: string, data: Data): Promise<PasswordResetResponse> => {
    return new Promise((resolve, reject) => {
        http.post('/auth/password/reset', {
            email,
            ...data,
        })
            .then((response) =>
                resolve({
                    redirectTo: response.data.redirect_to,
                    sendToLogin: response.data.send_to_login,
                }),
            )
            .catch(reject);
    });
};
