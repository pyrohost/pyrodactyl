import { ApplicationStore } from '@/state/index';
import { createTypedHooks } from 'easy-peasy';

const hooks = createTypedHooks<ApplicationStore>();

export const useStore = hooks.useStore;
export const useStoreState = hooks.useStoreState;
export const useStoreActions = hooks.useStoreActions;
export const useStoreDispatch = hooks.useStoreDispatch;
