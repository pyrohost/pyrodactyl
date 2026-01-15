import { createStore } from "easy-peasy";

import flashes, { type FlashStore } from "@/state/flashes";
import permissions, { type GloablPermissionsStore } from "@/state/permissions";
import progress, { type ProgressStore } from "@/state/progress";
import settings, { type SettingsStore } from "@/state/settings";
import user, { type UserStore } from "@/state/user";

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
