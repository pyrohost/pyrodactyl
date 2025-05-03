import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/components/App';

// Import cấu hình i18n (phải được import trước App)
import './i18n';

const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(
        <Suspense fallback='Loading...'>
            <App />
        </Suspense>,
    );
} else {
    console.error('Failed to find the root element');
}
