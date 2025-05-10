import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';

import { useStoreState } from '@/state/hooks';

/**
 * Component kiểm tra xác thực và chuyển hướng nếu người dùng chưa đăng nhập
 * @param children Nội dung hiển thị khi đã xác thực
 */
function AuthenticatedRoute({ children }: { children?: ReactNode }): JSX.Element {
    const { t } = useTranslation();
    const isAuthenticated = useStoreState((state) => !!state.user.data?.uuid);

    const location = useLocation();

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return <Navigate to='/auth/login' state={{ from: location.pathname }} />;
}

export default AuthenticatedRoute;
