import ItemContainer from '@/components/elements/ItemContainer';
import { Switch } from '@/components/elements/SwitchV2';

export interface SwitchProps {
    name: string;
    label: string;
    description: string;
    defaultChecked?: boolean;
    readOnly?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SwitchV2Container = ({ name, label, description, defaultChecked, readOnly, onChange }: SwitchProps) => {
    return (
        <ItemContainer title={label} description={description}>
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
        </ItemContainer>
    );
};
SwitchV2Container.displayName = 'SwitchV2Container';

export default SwitchV2Container;
