import type { JSX, ReactNode } from 'react';

import { ServerError } from '@/components/elements/ScreenBlock';

import { usePermissions } from '@/plugins/usePermissions';

interface Props {
    children?: ReactNode;
    permission?: string | string[];
}

function PermissionRoute({ children, permission }: Props): JSX.Element {
    const can = usePermissions(permission || []);

    if (permission === undefined || permission === null) {
        return <>{children}</>;
    }

    if (can.filter((p) => p).length > 0) {
        return <>{children}</>;
    }

    return <ServerError title='Acceso denegado' message='No tienes permiso para acceder a esta página.' />;
}

export default PermissionRoute;
