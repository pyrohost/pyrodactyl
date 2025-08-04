import { forwardRef } from 'react';

import SecondaryLink from '../ui/secondary-link';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;

const TitleSection = ({ title, subtitle }: { title?: string; subtitle?: string }) => (
    <div className='space-y-2 font-medium mb-8'>
        {title && <h2 className='text-3xl'>{title}</h2>}
        {/*{subtitle && <span className='text-primary/40'>{subtitle}</span>}*/}
        {subtitle && <span className='text-secondary'>{subtitle}</span>}
    </div>
);

const ReturnToLogin = () => {
    return <SecondaryLink to='/auth/login'>Return to login</SecondaryLink>;
};

const LoginFormContainer = forwardRef<HTMLFormElement, Props>(({ ...props }, ref) => (
    <div className='w-full text-sm'>
        <form {...props} ref={ref}>
            {props.children}
        </form>
    </div>
));

LoginFormContainer.displayName = 'LoginFormContainer';

export { TitleSection, ReturnToLogin };
export default LoginFormContainer;
