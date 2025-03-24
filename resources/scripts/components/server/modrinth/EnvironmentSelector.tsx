import * as React from 'react';

import { CheckboxArrow } from '@/components/elements/CheckBoxArrow';
import { Checkbox } from '@/components/elements/CheckboxLabel';
import ArrowDownIcon from '@/components/elements/hugeicons/ArrowDown';

import { fetchNewProjects } from './config';

// import { fetchProjectsGlobal } from './DisplayMods';

interface Props {
    items: string[];
    onSelectionChange: (selectedItems: string[]) => void;
}

const EnvironmentSelector: React.FC<Props> = ({ items, onSelectionChange }) => {
    const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
    const [showAll, setShowAll] = React.useState(false);

    const handleToggle = (item: string) => {
        setSelectedItems((prev) => {
            const updatedItems = prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item];

            onSelectionChange(updatedItems);
            return updatedItems;
        });
    };

    return (
        <div>
            {items.slice(0, showAll ? items.length : 5).map((item) => (
                <Checkbox key={item} label={item} onChange={() => handleToggle(item)} />
            ))}
            {items.length > 5 && (
                <div onClick={fetchNewProjects()}>
                    <div className='flex items-center gap-2 cursor-pointer mt-2' onClick={() => setShowAll(!showAll)}>
                        <CheckboxArrow label={showAll ? 'Show Less' : 'Show More'} toggleable={false} />
                        <ArrowDownIcon
                            className={`transform transition-transform ${showAll ? 'rotate-180' : ''}`}
                            fill='currentColor'
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnvironmentSelector;
