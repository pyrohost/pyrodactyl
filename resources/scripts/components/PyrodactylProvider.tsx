import { useTranslation } from 'react-i18next';

interface Props {
    children: React.ReactNode;
}

/**
 * Component cung cấp thông tin về phiên bản và môi trường Pyrodactyl
 * @param children Nội dung bên trong provider
 */
const PyrodactylProvider = ({ children }: Props) => {
    const { t } = useTranslation();

    return (
        <div
            data-pyro-pyrodactylprovider=''
            data-pyro-pyrodactyl-version={import.meta.env.VITE_PYRODACTYL_VERSION}
            data-pyro-pyrodactyl-build={import.meta.env.VITE_PYRODACTYL_BUILD_NUMBER}
            data-pyro-commit-hash={import.meta.env.VITE_COMMIT_HASH}
            style={{
                display: 'contents',
            }}
        >
            {children}
        </div>
    );
};

export default PyrodactylProvider;
