import { createStore } from 'easy-peasy';

import flashes, { FlashStore } from '@/state/flashes';
import permissions, { GloablPermissionsStore } from '@/state/permissions';
import progress, { ProgressStore } from '@/state/progress';
import settings, { SettingsStore } from '@/state/settings';
import user, { UserStore } from '@/state/user';

export interface ApplicationStore {
    permissions: GloablPermissionsStore;
    flashes: FlashStore;
    user: UserStore;
    settings: SettingsStore;
    progress: ProgressStore;
}

const state: ApplicationStore = {
    permissions,
    flashes,
    user,
    settings,
    progress,
};

export const store = createStore(state);
