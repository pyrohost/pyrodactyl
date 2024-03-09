import { render } from 'react-dom';
import * as Sentry from '@sentry/react';
import App from '@/components/App';

Sentry.init({
    // This is safe to be public.
    // See https://docs.sentry.io/product/sentry-basics/concepts/dsn-explainer/ for more information.
    dsn: 'https://14d9c749b3286d03c85d783748fd13c9@o4506882582577152.ingest.us.sentry.io/4506882584150016',
    integrations: [],
});

render(<App />, document.getElementById('app'));
