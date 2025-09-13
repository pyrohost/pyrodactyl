import type { JSX, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ServerError } from '@/components/elements/ScreenBlock';

import { usePermissions } from '@/plugins/usePermissions';

interface Props {
    children?: ReactNode;
    permission?: string | string[];
}

function PermissionRoute({ children, permission }: Props): JSX.Element {
    const can = usePermissions(permission || []);
    const { t } = useTranslation();

    if (permission === undefined || permission === null) {
        return <>{children}</>;
    }



    if (can.filter((p) => p).length > 0) {
        return <>{children}</>;
    }

    return <ServerError title={t('errors.access_denied_title')} message={t('errors.access_denied_message')} />;
}

export default PermissionRoute;
