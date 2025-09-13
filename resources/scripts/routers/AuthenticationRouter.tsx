import { Route, Routes } from 'react-router-dom';

import ForgotPasswordContainer from '@/components/auth/ForgotPasswordContainer';
import LoginCheckpointContainer from '@/components/auth/LoginCheckpointContainer';
import LoginContainer from '@/components/auth/LoginContainer';
import ResetPasswordContainer from '@/components/auth/ResetPasswordContainer';
import { NotFound } from '@/components/elements/ScreenBlock';

const AuthenticationRouter = () => {
    return (
        <div
            style={{
                background: 'radial-gradient(124.75% 124.75% at 50.01% -10.55%, #121212 0%, #000000 100%)',
            }}
            className={'w-full h-full flex justify-center items-center rounded-md'}
        >
            <Routes>
                <Route path='login' element={<LoginContainer />} />
                <Route path='login/checkpoint/*' element={<LoginCheckpointContainer />} />
                <Route path='password' element={<ForgotPasswordContainer />} />
                <Route path='password/reset/:token' element={<ResetPasswordContainer />} />
                <Route path='*' element={<NotFound />} />
            </Routes>
        </div>
    );
};

export default AuthenticationRouter;
