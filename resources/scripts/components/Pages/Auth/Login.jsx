import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
    });

    const submit = (FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Login" />
            <form onSubmit={submit}>
                <input
                    type="text"
                    value={data.username}
                    onChange={e => setData('username', e.target.value)}
                />
                {errors.username && <div>{errors.username}</div>}
                
                <input
                    type="password"
                    value={data.password}
                    onChange={e => setData('password', e.target.value)}
                />
                {errors.password && <div>{errors.password}</div>}

                <button type="submit" disabled={processing}>
                    Login
                </button>
            </form>
        </>
    );
}