import * as React from 'react';

import { CheckboxArrow } from '@/components/elements/CheckBoxArrow';
import { Checkbox } from '@/components/elements/CheckboxLabel';
import ArrowDownIcon from '@/components/elements/hugeicons/ArrowDown';

interface Props {
    items: string[];
}

const EnvironmentSelector: React.FC<Props> = ({ items }) => {
    const [checked, setChecked] = React.useState(false);

    const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
    const [showAll, setShowAll] = React.useState(false);

    const handleToggle = (item: string) => {
        setSelectedItems((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
    };

    return (
        <div>
            {items.slice(0, showAll ? items.length : 5).map((item) => (
                <Checkbox key={item} label={item} onChange={() => handleToggle(item)} />
            ))}
            {items.length > 5 && (
                <div className='flex items-center gap-2 cursor-pointer mt-2' onClick={() => setShowAll(!showAll)}>
                    <CheckboxArrow label={showAll ? 'Show Less' : 'Show More'} />
                    <ArrowDownIcon
                        className={`transform transition-transform ${showAll ? 'rotate-180' : ''}`}
                        fill='currentColor'
                    />
                </div>
            )}
        </div>
    );
};

export default EnvironmentSelector;
