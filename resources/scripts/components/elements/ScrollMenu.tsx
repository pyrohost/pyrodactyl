import * as React from 'react';

import { Checkbox } from '@/components/elements/CheckboxLabel';

import { cn } from '@/lib/utils';

const ScrollMenu = React.forwardRef<
    React.ElementRef<'div'>,
    React.ComponentPropsWithoutRef<'div'> & { items: string[] }
>(({ className, items, ...props }, ref) => {
    const [checkedItems, setCheckedItems] = React.useState<string[]>([]);

    // Handle checkbox change
    const handleCheckboxChange = (item: string) => {
        // Update the checked state
        setCheckedItems((prev) => {
            const updatedItems = prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item];

            // Log the name of the item that was selected/deselected
            console.log(`${item} is now ${updatedItems.includes(item) ? 'selected' : 'deselected'}`);
            console.log(updatedItems);

            return updatedItems;
        });
    };

    return (
        <div ref={ref} className={cn('relative', className)} {...props}>
            <div className='overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-[#FF343C] hover:scrollbar-thumb-[#F06F53] scrollbar-track-[#000000]'>
                <ul>
                    {items.map((item) => (
                        <li key={item}>
                            <Checkbox
                                label={item}
                                // checked={checkedItems.includes(item)} // Set checked state
                                onChange={() => handleCheckboxChange(item)} // Handle change
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
});

ScrollMenu.displayName = 'ScrollMenu';

export { ScrollMenu };
