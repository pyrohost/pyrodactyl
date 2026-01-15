import {
    Box,
    BranchesDown,
    ClockArrowRotateLeft,
    CloudArrowUpIn,
    Database,
    FolderOpen,
    Gear,
    House,
    PencilToLine,
    Persons,
    Terminal,
} from '@gravity-ui/icons';
import type { ComponentType, SVGProps } from 'react';
import { lazy } from 'react';

import AccountApiContainer from '@/components/dashboard/AccountApiContainer';
import AccountOverviewContainer from '@/components/dashboard/AccountOverviewContainer';
import ActivityLogContainer from '@/components/dashboard/activity/ActivityLogContainer';
import AccountSSHContainer from '@/components/dashboard/ssh/AccountSSHContainer';
import ServerActivityLogContainer from '@/components/server/ServerActivityLogContainer';
import BackupContainer from '@/components/server/backups/BackupContainer';
import ServerConsoleContainer from '@/components/server/console/ServerConsoleContainer';
import DatabasesContainer from '@/components/server/databases/DatabasesContainer';
import FileManagerContainer from '@/components/server/files/FileManagerContainer';
import ModrinthContainer from '@/components/server/modrinth/ModrinthContainer';
import NetworkContainer from '@/components/server/network/NetworkContainer';
import ScheduleContainer from '@/components/server/schedules/ScheduleContainer';
import SettingsContainer from '@/components/server/settings/SettingsContainer';
import ShellContainer from '@/components/server/shell/ShellContainer';
import StartupContainer from '@/components/server/startup/StartupContainer';
import CreateUserContainer from '@/components/server/users/CreateUserContainer';
import EditUserContainer from '@/components/server/users/EditUserContainer';
import UsersContainer from '@/components/server/users/UsersContainer';

// Each of the router files is already code split out appropriately — so
// all the items above will only be loaded in when that router is loaded.
//
// These specific lazy loaded routes are to avoid loading in heavy screens
// for the server dashboard when they're only needed for specific instances.
const FileEditContainer = lazy(() => import('@/components/server/files/FileEditContainer'));
const ScheduleEditContainer = lazy(() => import('@/components/server/schedules/ScheduleEditContainer'));

// Icon component type that works with Gravity UI icons
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// Feature limit types for visibility conditions
export type FeatureLimitKey = 'databases' | 'backups' | 'allocations';

interface RouteDefinition {
    /**
     * Route is the path that will be matched against, this field supports wildcards.
     */
    route: string;
    /**
     * Path is the path that will be used for any navbars or links, do not use wildcards or fancy
     * matchers here. If this field is left undefined, this route will not have a navigation element.
     */
    path?: string;
    // If undefined is passed this route is still rendered into the router itself
    // but no navigation link is displayed in the sub-navigation menu.
    name: string | undefined;
    component: ComponentType;
    end?: boolean;
}

export interface ServerRouteDefinition extends RouteDefinition {
    permission?: string | string[] | null;
    /**
     * Icon to display in the sidebar/navigation.
     * If undefined, the route won't have a navigation element.
     */
    icon?: IconComponent;
    /**
     * Feature limit key to check. If the limit is 0, the nav item is hidden.
     * Special value 'network' checks both allocations limit AND subdomain support.
     */
    featureLimit?: FeatureLimitKey | 'network';
    /**
     * Whether this is a sub-route that shouldn't appear in navigation.
     */
    isSubRoute?: boolean;
    /**
     * Route path patterns that should highlight this nav item.
     * Used for matching nested routes to parent nav items.
     */
    highlightPatterns?: RegExp[];
}

interface Routes {
    // All the routes available under "/account"
    account: RouteDefinition[];
    // All the routes available under "/server/:id"
    server: ServerRouteDefinition[];
}

const routes: Routes = {
    account: [
        {
            route: '',
            path: '',
            name: 'Account',
            component: AccountOverviewContainer,
            end: true,
        },
        {
            route: 'api',
            path: 'api',
            name: 'API Credentials',
            component: AccountApiContainer,
        },
        {
            route: 'ssh',
            path: 'ssh',
            name: 'SSH Keys',
            component: AccountSSHContainer,
        },
        {
            route: 'activity',
            path: 'activity',
            name: 'Activity',
            component: ActivityLogContainer,
        },
    ],
    server: [
        {
            route: '',
            path: '',
            permission: null,
            name: 'Home',
            component: ServerConsoleContainer,
            icon: House,
            end: true,
        },
        {
            route: 'files/*',
            path: 'files',
            permission: 'file.*',
            name: 'Files',
            component: FileManagerContainer,
            icon: FolderOpen,
            highlightPatterns: [/^\/server\/[^/]+\/files(\/.*)?$/],
        },
        {
            route: 'files/:action/*',
            permission: 'file.*',
            name: undefined,
            component: FileEditContainer,
            isSubRoute: true,
        },
        {
            route: 'databases/*',
            path: 'databases',
            permission: 'database.*',
            name: 'Databases',
            component: DatabasesContainer,
            icon: Database,
            featureLimit: 'databases',
            end: true,
        },
        {
            route: 'backups/*',
            path: 'backups',
            permission: 'backup.*',
            name: 'Backups',
            component: BackupContainer,
            icon: CloudArrowUpIn,
            featureLimit: 'backups',
            end: true,
        },
        {
            route: 'network/*',
            path: 'network',
            permission: 'allocation.*',
            name: 'Networking',
            component: NetworkContainer,
            icon: BranchesDown,
            featureLimit: 'network',
            end: true,
        },
        {
            route: 'users/*',
            path: 'users',
            permission: 'user.*',
            name: 'Users',
            component: UsersContainer,
            icon: Persons,
            end: true,
        },
        {
            route: 'users/new',
            permission: 'user.*',
            name: undefined,
            component: CreateUserContainer,
            isSubRoute: true,
        },
        {
            route: 'users/:id/edit',
            permission: 'user.*',
            name: undefined,
            component: EditUserContainer,
            isSubRoute: true,
        },
        {
            route: 'startup/*',
            path: 'startup',
            permission: ['startup.read', 'startup.update', 'startup.docker-image'],
            name: 'Startup',
            component: StartupContainer,
            icon: Terminal,
            end: true,
        },
        {
            route: 'schedules/*',
            path: 'schedules',
            permission: 'schedule.*',
            name: 'Schedules',
            component: ScheduleContainer,
            icon: ClockArrowRotateLeft,
            highlightPatterns: [/^\/server\/[^/]+\/schedules(\/\d+)?$/],
        },
        {
            route: 'schedules/:id/*',
            permission: 'schedule.*',
            name: undefined,
            component: ScheduleEditContainer,
            isSubRoute: true,
        },
        {
            route: 'settings/*',
            path: 'settings',
            permission: ['settings.*', 'file.sftp'],
            name: 'Settings',
            component: SettingsContainer,
            icon: Gear,
            end: true,
        },
        {
            route: 'activity/*',
            path: 'activity',
            permission: 'activity.*',
            name: 'Activity',
            component: ServerActivityLogContainer,
            icon: PencilToLine,
            end: true,
        },
        {
            route: 'shell/*',
            path: 'shell',
            permission: 'startup.software',
            name: 'Software',
            component: ShellContainer,
            icon: Box,
            end: true,
        },
        {
            route: 'mods/*',
            path: 'mods',
            permission: ['modrinth.download', 'settings.modrinth'],
            name: 'Modrinth',
            component: ModrinthContainer,
            isSubRoute: true, // Hidden until modrinth support is complete
        },
    ],
};

export default routes;

/**
 * Get navigation routes (routes that should appear in sidebar/mobile menu).
 * Filters out sub-routes and routes without names or icons.
 */
export const getServerNavRoutes = (): ServerRouteDefinition[] => {
    return routes.server.filter((route) => route.name && route.icon && !route.isSubRoute);
};
