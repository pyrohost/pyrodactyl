import { HugeiconsIcon, IconSvgElement } from '@hugeicons/react';
import { memo } from 'react';
import { NavLink } from 'react-router-dom';

import Can from '@/components/elements/Can';

interface RenderedNavItem {
    to: string;
    icon: IconSvgElement;
    text: string;
    itemRef: React.RefObject<HTMLAnchorElement | null>;
    end: boolean;
    lastItem?: boolean;
    permission?: string | string[];
    onNavClick?: () => void;
}

const NavItem = memo(({ to, icon, text, itemRef, end, permission, onNavClick }: RenderedNavItem) => {
    const navLink = (
        <NavLink
            to={to}
            end={end}
            className='nav-item flex items-center duration-200 select-none font-medium relative opacity-40 '
            ref={itemRef}
            draggable={false}
            onClick={onNavClick}
        >
            <HugeiconsIcon className='nav-icon size-5 shrink-0 transition-transform' strokeWidth={2} icon={icon} />
            <p className='nav-text text-sm text-nowrap transition-transform'>{text}</p>
        </NavLink>
    );

    // if permission specified, wrap in Can component
    if (permission) {
        return (
            <Can action={permission} matchAny>
                {navLink}
            </Can>
        );
    }

    return navLink;
});

NavItem.displayName = 'NavItem';

export default NavItem;
