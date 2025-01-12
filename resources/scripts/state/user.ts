import { useForm } from '@inertiajs/react';

export interface UserData {
    uuid: string;
    username: string;
    email: string;
    language: string;
    rootAdmin: boolean;
    useTotp: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface EmailUpdateData {
    email: string;
    password: string;
}

export const useEmailUpdate = (initialData: EmailUpdateData) => {
    return useForm({
        email: initialData.email,
        password: initialData.password,
    });
};

export const handleEmailUpdate = (form: ReturnType<typeof useEmailUpdate>) => {
    form.post(route('account.email'), {
        preserveScroll: true,
        onSuccess: () => {
            form.reset('password');
        }
    });
};

// Add default export
export default {
    useEmailUpdate,
    handleEmailUpdate
};