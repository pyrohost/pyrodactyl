import { ServerContext } from '@/state/server';
import styled from 'styled-components';
import Input from '@/components/elements/Input';

export const FileActionCheckbox = styled(Input)`
    && {
        background: transparent;
        border: #ffffffaa;

        &:not(:checked):hover {
            border-color: #ffffff55;
        }
    }
`;

export default ({ name }: { name: string }) => {
    const isChecked = ServerContext.useStoreState((state) => state.files.selectedFiles.indexOf(name) >= 0);
    const appendSelectedFile = ServerContext.useStoreActions((actions) => actions.files.appendSelectedFile);
    const removeSelectedFile = ServerContext.useStoreActions((actions) => actions.files.removeSelectedFile);

    return (
        <label className={`flex-none px-4 py-2 absolute self-center z-30 cursor-pointer`}>
            <FileActionCheckbox
                name={'selectedFiles'}
                value={name}
                checked={isChecked}
                type={'checkbox'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.currentTarget.checked) {
                        appendSelectedFile(name);
                    } else {
                        removeSelectedFile(name);
                    }
                }}
            />
        </label>
    );
};
