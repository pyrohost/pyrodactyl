const MainWrapper = ({ children, className = '', ...props }) => (
    <main
        data-pyro-main=''
        data-pyro-transitionrouter=''
        className={`relative h-[calc(100% - 1.5rem)] w-full mr-(--main-wrapper-spacing) ml-0 mb-(--main-wrapper-spacing) [--main-wrapper-spacing:--spacing(2)] ${className}`}
        {...props}
    >
        {children}
    </main>
);

export default MainWrapper;
