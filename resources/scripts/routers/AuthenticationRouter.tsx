import { Route, Routes, useNavigate } from 'react-router-dom';

import LoginContainer from '@/components/auth/LoginContainer';
import ForgotPasswordContainer from '@/components/auth/ForgotPasswordContainer';
import ResetPasswordContainer from '@/components/auth/ResetPasswordContainer';
import LoginCheckpointContainer from '@/components/auth/LoginCheckpointContainer';
import { NotFound } from '@/components/elements/ScreenBlock';

export default () => {
    const navigate = useNavigate();

    return (
        <div
            style={{
                background: 'radial-gradient(124.75% 124.75% at 50.01% -10.55%, #121212 0%, #000000 100%)',
            }}
            className={'w-full h-full flex justify-center items-center'}
        >
            <Routes>
                <Route path='login' element={<LoginContainer />} />
                <Route path='login/checkpoint/*' element={<LoginCheckpointContainer />} />
                <Route path='password' element={<ForgotPasswordContainer />} />
                <Route path='password/reset/:token' element={<ResetPasswordContainer />} />
                <Route path='*' element={<NotFound onBack={() => navigate('/auth/login')} />} />
            </Routes>
        </div>
    );
};
