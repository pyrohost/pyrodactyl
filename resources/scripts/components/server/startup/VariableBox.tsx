import debounce from 'debounce';
import { memo, useState } from 'react';
import isEqual from 'react-fast-compare';

import FlashMessageRender from '@/components/FlashMessageRender';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import InputSpinner from '@/components/elements/InputSpinner';
import { Switch } from '@/components/elements/SwitchV2';
import { Input } from '@/components/elements/TextInput';
import HugeIconsArrowDown from '@/components/elements/hugeicons/ArrowDown';
import HugeIconsArrowUp from '@/components/elements/hugeicons/ArrowUp';
import HugeIconsSquareLock from '@/components/elements/hugeicons/SquareLock';

import { ServerEggVariable } from '@/api/server/types';
import updateStartupVariable from '@/api/server/updateStartupVariable';
import getServerStartup from '@/api/swr/getServerStartup';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';
import { usePermissions } from '@/plugins/usePermissions';

interface Props {
    variable: ServerEggVariable;
}

const VariableBox = ({ variable }: Props) => {
    const FLASH_KEY = `server:startup:${variable.envVariable}`;

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [loading, setLoading] = useState(false);
    const [canEdit] = usePermissions(['startup.update']);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { mutate } = getServerStartup(uuid);
    const [dropDownOpen, setDropDownOpen] = useState(false);

    const setVariableValue = debounce((value: string) => {
        setLoading(true);
        clearFlashes(FLASH_KEY);

        updateStartupVariable(uuid, variable.envVariable, value)
            .then(([response, invocation]) =>
                mutate(
                    (data) => ({
                        ...data!,
                        invocation,
                        variables: (data!.variables || []).map((v) =>
                            v.envVariable === response.envVariable ? response : v,
                        ),
                    }),
                    false,
                ),
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: FLASH_KEY, error });
            })
            .then(() => setLoading(false));
    }, 500);

    const useSwitch = variable.rules.some(
        (v) => v === 'boolean' || v === 'in:0,1' || v === 'in:1,0' || v === 'in:true,false' || v === 'in:false,true',
    );
    const isStringSwitch = variable.rules.some((v) => v === 'string');
    const selectValues = variable.rules.find((v) => v.startsWith('in:'))?.split(',') || [];

    return (
        <div
            className={`flex flex-col justify-between gap-2 bg-[#3333332a] border-[1px] border-[#ffffff0e] p-4 rounded-lg`}
        >
            <FlashMessageRender byKey={FLASH_KEY} />
            <div className={`text-sm mb-2`}>
                <div className={`flex items-center gap-2`}>
                    {!variable.isEditable && (
                        <HugeIconsSquareLock fill={'currentColor'} className={`text-neutral-600`} />
                    )}
                    {variable.name}
                </div>
                <p className={`mt-1 text-xs text-neutral-300`}>{variable.description}</p>
            </div>
            <InputSpinner visible={loading}>
                {useSwitch ? (
                    <>
                        <Switch
                            disabled={!canEdit || !variable.isEditable}
                            name={variable.envVariable}
                            defaultChecked={
                                isStringSwitch ? variable.serverValue === 'true' : variable.serverValue === '1'
                            }
                            onCheckedChange={() => {
                                if (canEdit && variable.isEditable) {
                                    if (isStringSwitch) {
                                        setVariableValue(variable.serverValue === 'true' ? 'false' : 'true');
                                    } else {
                                        setVariableValue(variable.serverValue === '1' ? '0' : '1');
                                    }
                                }
                            }}
                        />
                    </>
                ) : (
                    <>
                        {selectValues.length > 0 && (variable.serverValue ?? variable.defaultValue) ? (
                            <>
                                <DropdownMenu onOpenChange={(open) => setDropDownOpen(open)}>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            className='flex items-center justify-center h-8 px-4 text-sm font-medium text-white transition-colors duration-150 bg-linear-to-b from-[#ffffff10] to-[#ffffff09] border border-[#ffffff15] rounded-xl shadow-xs hover:from-[#ffffff05] hover:to-[#ffffff04] cursor-pointer'
                                            disabled={!canEdit || !variable.isEditable}
                                        >
                                            {variable.serverValue}
                                            {dropDownOpen ? (
                                                <HugeIconsArrowUp
                                                    fill={'currentColor'}
                                                    className={`ml-2 w-[16px] h-[16px]`}
                                                />
                                            ) : (
                                                <HugeIconsArrowDown
                                                    fill={'currentColor'}
                                                    className={`ml-2 w-[16px] h-[16px]`}
                                                />
                                            )}
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className='z-99999' sideOffset={8}>
                                        <DropdownMenuRadioGroup
                                            value={variable.serverValue}
                                            onValueChange={setVariableValue}
                                        >
                                            {selectValues.map((selectValue) => (
                                                <DropdownMenuRadioItem
                                                    key={selectValue.replace('in:', '')}
                                                    value={selectValue.replace('in:', '')}
                                                >
                                                    {selectValue.replace('in:', '')}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <Input
                                    className='w-1/2'
                                    onKeyUp={(e) => {
                                        if (canEdit && variable.isEditable) {
                                            setVariableValue(e.currentTarget.value);
                                        }
                                    }}
                                    readOnly={!canEdit || !variable.isEditable}
                                    name={variable.envVariable}
                                    defaultValue={variable.serverValue ?? ''}
                                    placeholder={variable.defaultValue}
                                    disabled={!canEdit || !variable.isEditable}
                                />
                            </>
                        )}
                    </>
                )}
            </InputSpinner>
        </div>
    );
};

export default memo(VariableBox, isEqual);
