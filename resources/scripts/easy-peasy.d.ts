/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection ES6UnusedImports
import { ApplicationStore } from '@/state';
import EasyPeasy, { Actions, State } from 'easy-peasy';

declare module 'easy-peasy' {
    export function useStoreState<Result>(mapState: (state: State<ApplicationStore>) => Result): Result;

    export function useStoreActions<Result>(mapActions: (actions: Actions<ApplicationStore>) => Result): Result;
}
