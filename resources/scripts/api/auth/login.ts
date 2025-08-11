import http from '@/api/http';

interface LoginData {
    user: string;
    password: string;
    [key: string]: any; // Allow additional fields like captcha responses
}

interface LoginResponse {
    complete: boolean;
    intended?: string;
    confirmationToken?: string;
    error?: string;
}

export default async (data: LoginData): Promise<LoginResponse> => {
    try {
        await http.get('/sanctum/csrf-cookie');

        // Pass through all data including captcha responses
        const payload: Record<string, any> = {
            ...data,
        };

        const response = await http.post('/auth/login', payload);

        if (!response.data || typeof response.data !== 'object') {
            throw new Error('Invalid server response format');
        }

        return {
            complete: response.data.complete ?? response.data.data?.complete ?? false,
            intended: response.data.intended ?? response.data.data?.intended,
            confirmationToken:
                response.data.confirmationToken ??
                response.data.data?.confirmation_token ??
                response.data.data?.confirmationToken,
            error: response.data.error ?? response.data.message,
        };
    } catch (error: any) {
        const loginError = new Error(
            error.response?.data?.error ??
                error.response?.data?.message ??
                error.message ??
                'Login failed. Please try again.',
        ) as any;

        loginError.response = error.response;
        loginError.detail = error.response?.data?.errors?.[0]?.detail;
        loginError.code = error.response?.data?.errors?.[0]?.code;

        console.error('Login API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            detail: loginError.detail,
            message: loginError.message,
        });

        throw loginError;
    }
};
