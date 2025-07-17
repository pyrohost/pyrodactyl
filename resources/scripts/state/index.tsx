'use client';

import { PropsWithChildren, createContext, useContext, useState } from 'react';

import { FlashMessage } from '@/state/flashes';

import { PanelPermissions } from './permissions';
import { UserData } from './user';

export interface State {
    user: UserData | null;
    permissions: PanelPermissions | null;
    flashes: FlashMessage[];
}

const StateContext = createContext<State & { setState: React.Dispatch<React.SetStateAction<State>> }>({
    user: null,
    permissions: null,
    flashes: [],
    setState: () => {},
});

export const StateProvider = ({ state: initialState, children }: PropsWithChildren<{ state: State }>) => {
    const [state, setState] = useState(initialState);

    return <StateContext.Provider value={{ ...initialState, ...state, setState }}>{children}</StateContext.Provider>;
};

export const useStateContext = () => {
    return useContext(StateContext);
};
