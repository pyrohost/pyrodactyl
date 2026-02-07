import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { memo, useState, useEffect, useRef } from 'react';

import { Input } from '@/components/ui/input';
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut';

const SearchIcon = memo(() => (
    <HugeiconsIcon
        size={16}
        strokeWidth={2}
        icon={Search01Icon}
        className='absolute top-1/2 left-4 -translate-y-1/2 transform text-cream-500/30'
    />
));
SearchIcon.displayName = 'SearchIcon';

interface SearchSectionProps {
    className?: string;
}

const SearchSection = memo(({ className }: SearchSectionProps) => {
    const [searchValue, setSearchValue] = useState('');

    const inputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className={`flex items-center gap-2 h-full group ${className || ''}`}>
            <div className='relative w-3/4 transition-all duration-200 ease-out group group-focus-within:w-full mx-auto'>
                <Input
                    id='header-search'
                    ref={inputRef}
                    type='text'
                    placeholder='Search servers...'
                    value={searchValue}
                    onChange={(e) => {
                        setSearchValue(e.target.value);
                    }}
                    className='pl-10 pr-16 mx-auto w-full group-focus-within:w-full transition-all duration-200 ease-out '
                />
                <SearchIcon />
                {!searchValue && (
                    <div className='absolute top-1/2 right-4 -translate-y-1/2 transform flex align-middle pointer-events-none group-focus-within:opacity-0 transition-all duration-200 ease-out '>
                        <KeyboardShortcut keys={['cmd', 'k']} variant='faded' />
                    </div>
                )}
            </div>
        </div>
    );
});

SearchSection.displayName = 'SearchSection';

export default SearchSection;
