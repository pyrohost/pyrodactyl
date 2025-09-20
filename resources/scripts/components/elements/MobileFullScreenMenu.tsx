import React from 'react';
import { NavLink } from 'react-router-dom';

import Can from '@/components/elements/Can';
import HugeIconsApi from '@/components/elements/hugeicons/Api';
import HugeIconsClock from '@/components/elements/hugeicons/Clock';
import HugeIconsCloudUp from '@/components/elements/hugeicons/CloudUp';
import HugeIconsConnections from '@/components/elements/hugeicons/Connections';
import HugeIconsConsole from '@/components/elements/hugeicons/Console';
import HugeIconsController from '@/components/elements/hugeicons/Controller';
import HugeIconsDashboardSettings from '@/components/elements/hugeicons/DashboardSettings';
import HugeIconsDatabase from '@/components/elements/hugeicons/Database';
import HugeIconsFolder from '@/components/elements/hugeicons/Folder';
import HugeIconsHome from '@/components/elements/hugeicons/Home';
import HugeIconsPencil from '@/components/elements/hugeicons/Pencil';
import HugeIconsPeople from '@/components/elements/hugeicons/People';
import HugeIconsSsh from '@/components/elements/hugeicons/Ssh';
import HugeIconsX from '@/components/elements/hugeicons/X';

interface MobileFullScreenMenuProps {
    isVisible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const MobileFullScreenMenu = ({ isVisible, onClose, children }: MobileFullScreenMenuProps) => {
    if (!isVisible) return null;

    return (
        <div className='lg:hidden fixed inset-0 z-9999 bg-[#1a1a1a] pt-16'>
            {/* Close button */}
            <button
                onClick={onClose}
                className='absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200'
                aria-label='Close menu'
            >
                <HugeIconsX fill='currentColor' />
            </button>

            {/* Full screen navigation menu */}
            <div className='h-full overflow-y-auto'>
                <div className='p-6'>
                    {/* Menu items */}
                    <nav className='space-y-2'>{children}</nav>
                </div>
            </div>
        </div>
    );
};

interface DashboardMobileMenuProps {
    isVisible: boolean;
    onClose: () => void;
}

export const DashboardMobileMenu = ({ isVisible, onClose }: DashboardMobileMenuProps) => {
    const NavigationItem = ({
        to,
        icon: Icon,
        children,
        end = false,
    }: {
        to: string;
        icon: React.ComponentType<{ fill: string }>;
        children: React.ReactNode;
        end?: boolean;
    }) => (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center gap-4 p-4 rounded-md transition-all duration-200 ${
                    isActive
                        ? 'bg-gradient-to-r from-brand/20 to-brand/10 border-l-4 border-brand text-white'
                        : 'text-white/80 hover:text-white hover:bg-[#ffffff11] border-l-4 border-transparent'
                }`
            }
            onClick={onClose}
        >
            <Icon fill='currentColor' />
            <span className='text-lg font-medium'>{children}</span>
        </NavLink>
    );

    return (
        <MobileFullScreenMenu isVisible={isVisible} onClose={onClose}>
            <NavigationItem to='/' icon={HugeIconsHome} end>
                Servers
            </NavigationItem>
            <NavigationItem to='/account/api' icon={HugeIconsApi} end>
                API Keys
            </NavigationItem>
            <NavigationItem to='/account/ssh' icon={HugeIconsSsh} end>
                SSH Keys
            </NavigationItem>
            <NavigationItem to='/account' icon={HugeIconsDashboardSettings} end>
                Settings
            </NavigationItem>
        </MobileFullScreenMenu>
    );
};

interface ServerMobileMenuProps {
    isVisible: boolean;
    onClose: () => void;
    serverId?: string;
    databaseLimit?: number | null;
    backupLimit?: number | null;
    allocationLimit?: number | null;
    subdomainSupported?: boolean;
}

export const ServerMobileMenu = ({
    isVisible,
    onClose,
    serverId,
    databaseLimit,
    backupLimit,
    allocationLimit,
    subdomainSupported = false,
}: ServerMobileMenuProps) => {
    const NavigationItem = ({
        to,
        icon: Icon,
        children,
        end = false,
    }: {
        to: string;
        icon: React.ComponentType<{ fill: string }>;
        children: React.ReactNode;
        end?: boolean;
    }) => (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center gap-4 p-4 rounded-md transition-all duration-200 ${
                    isActive
                        ? 'bg-gradient-to-r from-brand/20 to-brand/10 border-l-4 border-brand text-white'
                        : 'text-white/80 hover:text-white hover:bg-[#ffffff11] border-l-4 border-transparent'
                }`
            }
            onClick={onClose}
        >
            <Icon fill='currentColor' />
            <span className='text-lg font-medium'>{children}</span>
        </NavLink>
    );

    if (!serverId) return null;

    return (
        <MobileFullScreenMenu isVisible={isVisible} onClose={onClose}>
            <NavigationItem to={`/server/${serverId}`} icon={HugeIconsHome} end>
                Home
            </NavigationItem>

            <>
                <Can action={'file.*'} matchAny>
                    <NavigationItem to={`/server/${serverId}/files`} icon={HugeIconsFolder}>
                        Files
                    </NavigationItem>
                </Can>

                {databaseLimit !== 0 && (
                    <Can action={'database.*'} matchAny>
                        <NavigationItem to={`/server/${serverId}/databases`} icon={HugeIconsDatabase} end>
                            Databases
                        </NavigationItem>
                    </Can>
                )}

                {backupLimit !== 0 && (
                    <Can action={'backup.*'} matchAny>
                        <NavigationItem to={`/server/${serverId}/backups`} icon={HugeIconsCloudUp} end>
                            Backups
                        </NavigationItem>
                    </Can>
                )}

                {(allocationLimit > 0 || subdomainSupported) && (
                    <Can action={'allocation.*'} matchAny>
                        <NavigationItem to={`/server/${serverId}/network`} icon={HugeIconsConnections} end>
                            Networking
                        </NavigationItem>
                    </Can>
                )}

                <Can action={'user.*'} matchAny>
                    <NavigationItem to={`/server/${serverId}/users`} icon={HugeIconsPeople} end>
                        Users
                    </NavigationItem>
                </Can>

                <Can action={['startup.read', 'startup.update', 'startup.command', 'startup.docker-image']} matchAny>
                    <NavigationItem to={`/server/${serverId}/startup`} icon={HugeIconsConsole} end>
                        Startup
                    </NavigationItem>
                </Can>

                <Can action={'schedule.*'} matchAny>
                    <NavigationItem to={`/server/${serverId}/schedules`} icon={HugeIconsClock}>
                        Schedules
                    </NavigationItem>
                </Can>

                <Can action={['settings.*', 'file.sftp']} matchAny>
                    <NavigationItem to={`/server/${serverId}/settings`} icon={HugeIconsDashboardSettings} end>
                        Settings
                    </NavigationItem>
                </Can>

                <Can action={['activity.*', 'activity.read']} matchAny>
                    <NavigationItem to={`/server/${serverId}/activity`} icon={HugeIconsPencil} end>
                        Activity
                    </NavigationItem>
                </Can>
            </>

            <Can action={'startup.software'}>
                <NavigationItem to={`/server/${serverId}/shell`} icon={HugeIconsController} end>
                    Software
                </NavigationItem>
            </Can>
        </MobileFullScreenMenu>
    );
};

export default MobileFullScreenMenu;
