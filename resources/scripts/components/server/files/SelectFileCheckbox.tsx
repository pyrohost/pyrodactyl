import { Checkbox } from '@/components/elements/CheckboxNew';

import { ServerContext } from '@/state/server';

const SelectFileCheckbox = ({ name }: { name: string }) => {
    const isChecked = ServerContext.useStoreState((state) => state.files.selectedFiles.indexOf(name) >= 0);
    const appendSelectedFile = ServerContext.useStoreActions((actions) => actions.files.appendSelectedFile);
    const removeSelectedFile = ServerContext.useStoreActions((actions) => actions.files.removeSelectedFile);

    return (
        <Checkbox
            className='ml-4'
            name={'selectedFiles'}
            value={name}
            checked={isChecked}
            onCheckedChange={isChecked ? () => removeSelectedFile(name) : () => appendSelectedFile(name)}
        />
    );
};

export default SelectFileCheckbox;
