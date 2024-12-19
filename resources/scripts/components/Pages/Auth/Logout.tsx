import React, { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';

const Logout: React.FC = () => {
    const { processing, post } = useForm({});
    const [isShaking, setIsShaking] = useState(false);

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        setIsShaking(true);
        setTimeout(() => {
            post('/auth/logout');
        }, 1000); // Delay logout for 1 second to show the animation
    };

    return (
        <>
            <Head title="Logout" />
            <div className="min-h-screen flex items-center justify-center">
                <div 
                    className={`bg-white p-6 rounded shadow-md ${isShaking ? 'shake flash' : ''}`}
                    style={{
                        animation: isShaking ? 'shake 0.5s infinite, flash 0.5s infinite alternate' : 'none'
                    }}
                >
                    <h1 className="text-2xl font-bold mb-4">Logout</h1>
                    <p className="mb-4">Are you sure you want to logout?</p>
                    <form onSubmit={handleLogout}>
                        <button
                            type="submit"
                            disabled={processing || isShaking}
                            className={`bg-red-500 text-white px-4 py-2 rounded
                                ${(processing || isShaking) ? 'opacity-75 cursor-not-allowed' : 'hover:bg-red-600'}`}
                        >
                            {processing ? 'Logging out...' : 'Logout'}
                        </button>
                    </form>
                </div>
            </div>
            <style>{`
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                @keyframes flash {
                    from { background-color: white; }
                    to { background-color: #ff8080; }
                }
                .shake {
                    animation: shake 0.5s infinite;
                }
                .flash {
                    animation: flash 0.5s infinite alternate;
                }
            `}</style>
        </>
    );
};

export default Logout;