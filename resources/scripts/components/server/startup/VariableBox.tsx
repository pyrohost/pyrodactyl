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
        <div className='flex flex-col justify-between gap-4 bg-linear-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff15] p-4 sm:p-5 rounded-xl hover:border-[#ffffff20] transition-all'>
            <FlashMessageRender byKey={FLASH_KEY} />
            <div className='space-y-3'>
                <div className='flex flex-col items-baseline sm:flex-row sm:justify-between gap-2 sm:gap-3'>
                    <div className='flex items-center gap-2 min-w-0'>
                        {!variable.isEditable && (
                            <HugeIconsSquareLock
                                fill={'currentColor'}
                                className='text-neutral-500 w-4 h-4 flex-shrink-0'
                            />
                        )}
                        <span className='text-sm font-medium text-neutral-200 break-words'>{variable.name}</span>
                    </div>
                    <div className='text-xs leading-5 text-neutral-500 font-mono rounded w-fit'>
                        {variable.envVariable}
                    </div>
                </div>
                <p className='text-xs sm:text-sm text-neutral-400 leading-relaxed break-words'>
                    {variable.description}
                </p>
            </div>
            <InputSpinner visible={loading}>
                {useSwitch ? (
                    <div className='flex items-center justify-between p-3 sm:p-4 bg-linear-to-b from-[#ffffff06] to-[#ffffff03] border border-[#ffffff10] rounded-xl'>
                        <span className='text-sm font-medium text-neutral-300'>
                            {isStringSwitch
                                ? variable.serverValue === 'true'
                                    ? 'Enabled'
                                    : 'Disabled'
                                : variable.serverValue === '1'
                                  ? 'On'
                                  : 'Off'}
                        </span>
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
                    </div>
                ) : (
                    <>
                        {selectValues.length > 0 && (variable.serverValue ?? variable.defaultValue) ? (
                            <DropdownMenu onOpenChange={(open) => setDropDownOpen(open)}>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className='w-full flex items-center justify-between gap-3 h-11 sm:h-12 px-3 sm:px-4 text-sm font-medium text-white transition-all duration-200 bg-linear-to-b from-[#ffffff10] to-[#ffffff09] border border-[#ffffff15] rounded-xl hover:from-[#ffffff15] hover:to-[#ffffff10] hover:border-[#ffffff25] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation'
                                        disabled={!canEdit || !variable.isEditable}
                                    >
                                        <span className='font-mono text-neutral-200 truncate text-left'>
                                            {variable.serverValue}
                                        </span>
                                        {dropDownOpen ? (
                                            <HugeIconsArrowUp
                                                fill={'currentColor'}
                                                className='w-[14px] h-[14px] opacity-60 flex-shrink-0'
                                            />
                                        ) : (
                                            <HugeIconsArrowDown
                                                fill={'currentColor'}
                                                className='w-[14px] h-[14px] opacity-60 flex-shrink-0'
                                            />
                                        )}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className='z-99999' sideOffset={8}>
                                    <DropdownMenuRadioGroup
                                        value={variable.serverValue ?? ''}
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
                        ) : (
                            <Input
                                className='w-full h-11 sm:h-12 text-sm sm:text-base'
                                onKeyUp={(e) => {
                                    if (canEdit && variable.isEditable) {
                                        setVariableValue(e.currentTarget.value);
                                    }
                                }}
                                readOnly={!canEdit || !variable.isEditable}
                                name={variable.envVariable}
                                defaultValue={variable.serverValue ?? ''}
                                placeholder={variable.defaultValue || 'Enter value...'}
                                disabled={!canEdit || !variable.isEditable}
                            />
                        )}
                    </>
                )}
            </InputSpinner>
        </div>
    );
};

export default memo(VariableBox, isEqual);
