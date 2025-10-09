'use client';

import * as React from 'react';

import HugeIconsCheck from '@/components/elements/hugeicons/Check';
import HugeIconsChevronDown from '@/components/elements/hugeicons/ChevronDown';
import HugeIconsChevronUp from '@/components/elements/hugeicons/ChevronUp';

import { cn } from '@/lib/utils';

export interface ScrollItem {
    id: string | number;
    label: string;
}

interface ExpandableScrollBoxProps {
    placeholder?: string;
    items: ScrollItem[];
    maxHeight?: string;
    className?: string;
    buttonClassName?: string;
    boxClassName?: string;
    onSelect?: (item: ScrollItem) => void;
}

export function ExpandableScrollBox({
    placeholder = 'Selecciona una opción',
    items = [],
    maxHeight = '300px',
    className = '',
    buttonClassName = '',
    boxClassName = '',
    onSelect,
}: ExpandableScrollBoxProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState<ScrollItem | null>(null);

    const handleSelect = (item: ScrollItem) => {
        setSelectedItem(item);
        setIsOpen(false);
        if (onSelect) {
            onSelect(item);
        }
    };

    return (
        <div className={cn('w-full', className)}>
            {/* Selection Button */}
            <button
                className={cn(
                    'w-full px-6 py-3 rounded-md font-medium cursor-pointer',
                    'bg-custom-red text-white',
                    'hover:bg-custom-red-hover focus:outline-hidden focus:ring-2 focus:ring-custom-red-hover focus:ring-offset-2 focus:ring-offset-black',
                    'transition-colors duration-200 shadow-md',
                    'flex items-center justify-between',
                    buttonClassName,
                )}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls='scroll-box'
            >
                <span className='truncate'>{selectedItem ? selectedItem.label : placeholder}</span>
                {isOpen ? (
                    <HugeIconsChevronUp className='ml-2 h-5 w-5 shrink-0' />
                ) : (
                    <HugeIconsChevronDown className='ml-2 h-5 w-5 shrink-0' />
                )}
            </button>

            {/* Expandable Box with Scroll Menu */}
            <div
                id='scroll-box'
                className={cn(
                    'w-full mt-4 rounded-md overflow-hidden',
                    'bg-custom-medium-gray border-2 border-custom-dark-gray',
                    'shadow-lg transition-all duration-300 ease-in-out',
                    isOpen ? 'max-h-(--max-height) opacity-100 my-4' : 'max-h-0 opacity-0 my-0 border-0',
                    boxClassName,
                )}
                style={{ '--max-height': maxHeight } as React.CSSProperties}
            >
                {/* Scroll Container */}
                <div
                    className={cn('overflow-y-auto transition-all', isOpen ? 'opacity-100' : 'opacity-0')}
                    style={{ maxHeight }}
                >
                    <div className='py-1'>
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    'px-4 py-3 cursor-pointer transition-colors duration-150',
                                    'flex items-center justify-between',
                                    'hover:bg-custom-dark-gray text-white',
                                    selectedItem?.id === item.id
                                        ? 'bg-custom-dark-gray border-l-2 border-custom-red'
                                        : 'border-l-2 border-transparent',
                                )}
                                onClick={() => handleSelect(item)}
                            >
                                <span>{item.label}</span>
                                {selectedItem?.id === item.id && <HugeIconsCheck className='h-4 w-4 text-custom-red' />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
