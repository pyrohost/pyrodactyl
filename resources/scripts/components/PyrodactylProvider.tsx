// Provides necessary information for components to function properly
// million-ignore
const PyrodactylProvider = ({ children }) => {
    return (
        <div
            data-pyro-pyrodactylprovider=''
            data-pyro-pyrodactyl-version={process.env.NEXT_PUBLIC_PYRODACTYL_VERSION}
            data-pyro-commit-hash={process.env.NEXT_PUBLIC_COMMIT_HASH}
            style={{
                display: 'contents',
            }}
        >
            {children}
        </div>
    );
};

export default PyrodactylProvider;
