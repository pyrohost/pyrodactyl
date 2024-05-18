import debounce from 'debounce';
import { memo, useState } from 'react';
import isEqual from 'react-fast-compare';

import FlashMessageRender from '@/components/FlashMessageRender';
import InputSpinner from '@/components/elements/InputSpinner';
import Select from '@/components/elements/Select';
import { Switch } from '@/components/elements/SwitchV2';
import TitledGreyBox from '@/components/elements/TitledGreyBox';

import { ServerEggVariable } from '@/api/server/types';
import updateStartupVariable from '@/api/server/updateStartupVariable';
import getServerStartup from '@/api/swr/getServerStartup';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';
import { usePermissions } from '@/plugins/usePermissions';
import { Input } from '@/components/elements/TextInput';

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
        <div className={`flex flex-col gap-2 bg-[#3333332a] border-[1px] border-[#ffffff0e] p-4 rounded-lg`}>
            <FlashMessageRender byKey={FLASH_KEY} />
            <div className={`text-sm mb-2`}>
                {!variable.isEditable && (
                    <span className={`bg-neutral-700 text-xs py-1 px-2 rounded-full mr-2 mb-1`}>Read Only</span>
                )}
                {variable.name}
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
                        {selectValues.length > 0 ? (
                            <>
                                <Select
                                    onChange={(e) => setVariableValue(e.target.value)}
                                    name={variable.envVariable}
                                    defaultValue={variable.serverValue}
                                    disabled={!canEdit || !variable.isEditable}
                                >
                                    {selectValues.map((selectValue) => (
                                        <option
                                            key={selectValue.replace('in:', '')}
                                            value={selectValue.replace('in:', '')}
                                        >
                                            {selectValue.replace('in:', '')}
                                        </option>
                                    ))}
                                </Select>
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
                                    defaultValue={variable.serverValue}
                                    placeholder={variable.defaultValue}
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
