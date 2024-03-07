import { forwardRef } from 'react';
import { Form } from 'formik';
import FlashMessageRender from '@/components/FlashMessageRender';
type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <div className='w-full max-w-lg px-8'>
        {title && <h2 className={`text-3xl text-center text-zinc-100 font-medium py-4`}>{title}</h2>}
        <FlashMessageRender />
        <Form {...props} ref={ref}>
            <div className={`flex w-full`}>
                <div className={`flex-1`}>{props.children}</div>
            </div>
        </Form>
    </div>
));
