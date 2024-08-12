import { useMemo } from 'react';
import { v4 } from 'uuid';

import { Switch } from '@/components/elements/SwitchV2';

export interface SwitchProps {
    name: string;
    label: string;
    description: string;
    defaultChecked?: boolean;
    readOnly?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    children?: React.ReactNode;
}

const SwitchV2Wrapper = ({ name, label, description, defaultChecked, readOnly, onChange, children }: SwitchProps) => {
    const uuid = useMemo(() => v4(), []);

    return (
        <div className='flex items-center justify-between gap-2 bg-[#3333332a] border-[1px] border-[#ffffff0e] p-4 rounded-lg'>
            <div className='flex flex-col'>
                <label htmlFor={uuid} className='text-neutral-300 text-md font-bold'>
                    {label}
                </label>
                <label htmlFor={uuid} className='text-neutral-500 text-sm font-semibold'>
                    {description}
                </label>
            </div>
            {children || (
                <Switch
                    name={name}
                    onCheckedChange={(checked) => {
                        if (onChange) {
                            onChange({
                                target: { checked } as HTMLInputElement,
                            } as React.ChangeEvent<HTMLInputElement>);
                        }
                    }}
                    defaultChecked={defaultChecked}
                    disabled={readOnly}
                />
            )}
        </div>
    );
};
SwitchV2Wrapper.displayName = 'SwitchV2Wrapper';

export default SwitchV2Wrapper;
