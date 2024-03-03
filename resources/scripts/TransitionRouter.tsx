import { Route } from 'react-router';

const TransitionRouter: React.FC = ({ children }) => {
    return (
        <Route
            render={() => (
                <div
                    className='w-full h-full rounded-md'
                    style={{
                        background:
                            // 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                            'radial-gradient(124.75% 124.75% at 50.01% -10.55%, #101010 0%, #040404 100%)',
                    }}
                >
                    <main
                        data-pyro-main=''
                        data-pyro-transitionrouter=''
                        className='relative inset-[1px] w-full h-full overflow-y-auto overflow-x-hidden rounded-md bg-[#08080875]'
                    >
                        {children}
                    </main>
                </div>
            )}
        />
    );
};

export default TransitionRouter;
