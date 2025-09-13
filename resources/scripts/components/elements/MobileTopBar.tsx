import { NavLink } from 'react-router-dom';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import Logo from '@/components/elements/PyroLogo';
import HugeIconsMenu from '@/components/elements/hugeicons/Menu';

interface MobileTopBarProps {
    onMenuToggle: () => void;
    onTriggerLogout: () => void;
    onSelectAdminPanel?: () => void;
    rootAdmin?: boolean;
}

const MobileTopBar = ({ onMenuToggle, onTriggerLogout, onSelectAdminPanel, rootAdmin }: MobileTopBarProps) => {
    const handleMenuToggle = () => {
        try {
            if (onMenuToggle && typeof onMenuToggle === 'function') {
                onMenuToggle();
            }
        } catch (error) {
            console.error('Error in mobile menu toggle:', error);
        }
    };

    const handleLogout = () => {
        try {
            if (onTriggerLogout && typeof onTriggerLogout === 'function') {
                onTriggerLogout();
            }
        } catch (error) {
            console.error('Error in logout trigger:', error);
        }
    };

    const handleAdminPanel = () => {
        try {
            if (onSelectAdminPanel && typeof onSelectAdminPanel === 'function') {
                onSelectAdminPanel();
            }
        } catch (error) {
            console.error('Error in admin panel select:', error);
        }
    };

    return (
        <div className='lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-[#ffffff08] h-16 flex items-center justify-between px-4'>
            {/* Logo */}
            <NavLink to={'/'} className='flex shrink-0 h-8 w-fit'>
                <Logo uniqueId='mobile-topbar' />
            </NavLink>

            <div className='flex items-center gap-2'>
                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className='w-10 h-10 flex items-center justify-center rounded-md text-white hover:bg-[#ffffff11] p-2 cursor-pointer'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='16'
                                height='15'
                                fill='currentColor'
                                viewBox='0 0 16 15'
                                className='flex shrink-0 h-full w-full'
                            >
                                <path d='M8.9375 7.3775C8.9375 7.56341 8.88252 7.74515 8.7795 7.89974C8.67649 8.05432 8.53007 8.1748 8.35877 8.24595C8.18746 8.31709 7.99896 8.33571 7.8171 8.29944C7.63525 8.26317 7.4682 8.17364 7.33709 8.04218C7.20598 7.91072 7.11669 7.74323 7.08051 7.56088C7.04434 7.37854 7.06291 7.18954 7.13386 7.01778C7.20482 6.84601 7.32498 6.69921 7.47915 6.59592C7.63332 6.49263 7.81458 6.4375 8 6.4375C8.24864 6.4375 8.4871 6.53654 8.66291 6.71282C8.83873 6.8891 8.9375 7.1282 8.9375 7.3775ZM1.625 6.4375C1.43958 6.4375 1.25832 6.49263 1.10415 6.59592C0.949982 6.69921 0.829821 6.84601 0.758863 7.01778C0.687906 7.18954 0.669341 7.37854 0.705514 7.56088C0.741688 7.74323 0.830976 7.91072 0.962088 8.04218C1.0932 8.17364 1.26025 8.26317 1.4421 8.29944C1.62396 8.33571 1.81246 8.31709 1.98377 8.24595C2.15507 8.1748 2.30149 8.05432 2.4045 7.89974C2.50752 7.74515 2.5625 7.56341 2.5625 7.3775C2.5625 7.1282 2.46373 6.8891 2.28791 6.71282C2.1121 6.53654 1.87364 6.4375 1.625 6.4375ZM14.375 6.4375C14.1896 6.4375 14.0083 6.49263 13.8542 6.59592C13.7 6.69921 13.5798 6.84601 13.5089 7.01778C13.4379 7.18954 13.4193 7.37854 13.4555 7.56088C13.4917 7.74323 13.581 7.91072 13.7121 8.04218C13.8432 8.17364 14.0102 8.26317 14.1921 8.29944C14.374 8.33571 14.5625 8.31709 14.7338 8.24595C14.9051 8.1748 15.0515 8.05432 15.1545 7.89974C15.2575 7.74515 15.3125 7.56341 15.3125 7.3775C15.3125 7.1282 15.2137 6.8891 15.0379 6.71282C14.8621 6.53654 14.6236 6.4375 14.375 6.4375Z' />
                            </svg>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='z-99999' sideOffset={8}>
                        {rootAdmin && onSelectAdminPanel && (
                            <DropdownMenuItem onSelect={handleAdminPanel}>
                                Admin Panel
                                <span className='ml-2 z-10 rounded-full bg-brand px-2 py-1 text-xs text-white'>
                                    Staff
                                </span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleLogout}>Log Out</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Menu Toggle Button */}
                <button
                    onClick={handleMenuToggle}
                    className='w-10 h-10 flex items-center justify-center rounded-md text-white hover:bg-[#ffffff11] p-2 cursor-pointer'
                    aria-label='Toggle navigation menu'
                >
                    <HugeIconsMenu fill='currentColor' />
                </button>
            </div>
        </div>
    );
};

export default MobileTopBar;
