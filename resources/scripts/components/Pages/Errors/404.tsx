// resources/js/Pages/Errors/404.tsx

import React from 'react';
import { Link } from '@inertiajs/react';

export default function NotFound() {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-200">404</h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Page Not Found</p>
                <Link href="/dashboard" className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded">
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}