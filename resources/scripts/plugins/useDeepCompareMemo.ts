import { useDeepMemoize } from '@/plugins/useDeepMemoize';
import { DependencyList, useMemo } from 'react';

export const useDeepCompareMemo = <T>(callback: () => T, dependencies: DependencyList) =>
    useMemo(callback, useDeepMemoize(dependencies));
