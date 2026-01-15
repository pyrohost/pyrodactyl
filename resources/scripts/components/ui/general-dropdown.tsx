import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import ChevronDown from './icons/ChevronDown';

interface DropdownLink {
    label: string;
    href: string;
    external?: boolean;
}

interface DropdownNodeItem {
    content: React.ReactNode;
    onClick?: () => void;
}

const GeneralDropdown = ({
    trigger,
    items,
    side,
    offset,
}: {
    trigger: React.ReactNode;
    items: (React.ReactNode | DropdownLink | DropdownNodeItem)[];
    side?: 'top' | 'bottom' | 'left' | 'right';
    offset?: number;
    onClick?: () => void;
}) => {
    const handleItemClick = (item: DropdownLink) => {
        if (item.external) {
            window.open(item.href, '_blank', 'noopener,noreferrer');
        } else {
            window.location.href = item.href;
        }
    };

    const isDropdownLink = (item: React.ReactNode | DropdownLink | DropdownNodeItem): item is DropdownLink => {
        return typeof item === 'object' && item !== null && 'label' in item && 'href' in item;
    };

    const isDropdownNodeItem = (item: React.ReactNode | DropdownLink | DropdownNodeItem): item is DropdownNodeItem => {
        return typeof item === 'object' && item !== null && 'content' in item;
    };

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger>
                <div className='flex items-center gap-2 rounded-xl border border-cream-400/20 bg-mocha-300/50 px-3 py-1 text-sm font-medium text-cream-400 shadow-sm hover:bg-mocha-300/70 focus:outline-none hover:active:bg-mocha-300/90'>
                    {trigger}
                    <ChevronDown />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={offset} side={side} className='z-[9999]'>
                {items.map((item, idx) => {
                    if (isDropdownLink(item)) {
                        return (
                            <DropdownMenuItem
                                key={idx}
                                onSelect={() => handleItemClick(item)}
                                className={item.external ? 'cursor-pointer' : undefined}
                            >
                                {item.label}
                            </DropdownMenuItem>
                        );
                    } else if (isDropdownNodeItem(item)) {
                        return (
                            <DropdownMenuItem key={idx} onSelect={item.onClick}>
                                {item.content}
                            </DropdownMenuItem>
                        );
                    } else {
                        return <DropdownMenuItem key={idx}>{item}</DropdownMenuItem>;
                    }
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default GeneralDropdown;
