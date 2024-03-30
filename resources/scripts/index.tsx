// I know it's deprecated! We need to fix it!!!
// eslint-disable-next-line react/no-deprecated
import * as Sentry from '@sentry/react';
// eslint-disable-next-line react/no-deprecated
import { render } from 'react-dom';

import App from '@/components/App';

Sentry.init({
    // This is safe to be public.
    // See https://docs.sentry.io/product/sentry-basics/concepts/dsn-explainer/ for more information.
    dsn: 'https://b25e7066a7d647cea237cd72beec5c9f@app.glitchtip.com/6107',
    integrations: [],
});

render(<App />, document.getElementById('app'));
