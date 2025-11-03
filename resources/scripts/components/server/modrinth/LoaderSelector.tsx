import { useEffect, useMemo, useState } from 'react';

import { Checkbox } from '@/components/elements/CheckboxLabel';
import Input from '@/components/elements/Input';

import { ServerContext } from '@/state/server';

import { useGlobalStateContext } from './config';
import { getAvailableLoaders, getLoaderType } from './eggfeatures';

const DEFAULT_LOADERS = ['paper', 'spigot', 'purpur', 'fabric', 'forge', 'quilt', 'bungeecord'];

interface LoaderSelectorProps {
    maxVisible?: number;
    featuredLoaders?: string[];
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export const LoaderSelector = ({ maxVisible = 7, featuredLoaders = DEFAULT_LOADERS }: LoaderSelectorProps) => {
    const { loaders, selectedLoaders, setSelectedLoaders } = useGlobalStateContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [showAll, setShowAll] = useState(false);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data?.eggFeatures || []);
    const availableLoaders = getAvailableLoaders(eggFeatures);
    const loaderType = getLoaderType(eggFeatures);

    // selectedLoaders.push(...availableLoaders);
    // setSelectedLoaders([...new Set([...selectedLoaders, ...availableLoaders])]);
    useEffect(() => {
        selectedLoaders.push(...availableLoaders);
    }, []);

    const { featured, other, filtered } = useMemo(() => {
        if (!loaders.length) return { featured: [], other: [], filtered: [] };

        const fuzzyMatch = (text: string, query: string) => {
            const cleanText = text.toLowerCase();
            const cleanQuery = query.toLowerCase();
            return cleanText.includes(cleanQuery);
        };

        const filteredLoaders = searchQuery
            ? loaders.filter((loader) => fuzzyMatch(loader.name, searchQuery) || fuzzyMatch(loader.id, searchQuery))
            : loaders;

        const featured: typeof loaders = [];
        const other: typeof loaders = [];

        filteredLoaders.forEach((loader) => {
            if (featuredLoaders.includes(loader.id)) {
                featured.push(loader);
            } else {
                other.push(loader);
            }
        });

        featured.sort((a, b) => {
            const indexA = featuredLoaders.indexOf(a.id);
            const indexB = featuredLoaders.indexOf(b.id);
            return indexA - indexB;
        });

        other.sort((a, b) => a.name.localeCompare(b.name));

        return { featured, other, filtered: filteredLoaders };
    }, [loaders, searchQuery, featuredLoaders]);

    const loadersToShow = useMemo(() => {
        if (searchQuery) {
            return filtered;
        }

        if (showAll) {
            return [...featured, ...other];
        }

        return featured.slice(0, maxVisible);
    }, [featured, other, filtered, showAll, maxVisible, searchQuery]);

    const hasMoreLoaders = featured.length + other.length > maxVisible && !searchQuery;
    const showExpandButton = hasMoreLoaders && !showAll;
    const showCollapseButton = hasMoreLoaders && showAll;

    if (loaders.length === 0) {
        return <p className='text-sm text-gray-500'>No loaders available</p>;
    }

    return (
        <div className='space-y-3'>
            {/* Search Input */}
            <div className='relative'>
                <Input
                    type='text'
                    placeholder='Search loaders...'
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className='w-full pl-3 pr-8 py-2 text-sm'
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm'
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Loaders List */}
            <div className='space-y-2 max-h-80 overflow-y-auto'>
                {loadersToShow.length === 0 ? (
                    <p className='text-sm text-gray-500 text-center py-2'>
                        No loaders matching &quot;{searchQuery}&quot;
                    </p>
                ) : (
                    loadersToShow.map((loader) => (
                        <Checkbox
                            key={loader.id}
                            label={capitalizeFirstLetter(loader.name)}
                            checked={selectedLoaders.includes(loader.id)}
                            onChange={(isChecked) => {
                                const newSelected = isChecked
                                    ? [...selectedLoaders, loader.id]
                                    : selectedLoaders.filter((id) => id !== loader.id);
                                setSelectedLoaders(newSelected);
                            }}
                        />
                    ))
                )}
            </div>

            {/* Selection counter and clear search */}
            <div className='flex justify-between items-center pt-2 border-t border-gray-200'>
                <span className='text-xs text-gray-500'>{selectedLoaders.length} selected</span>

                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className='text-xs text-gray-600 hover:text-gray-800 font-medium'
                    >
                        Clear search
                    </button>
                )}
            </div>

            {/* Clean Modern Expand/Collapse Toggle */}
            {showExpandButton && (
                <div className='pt-2 border-t border-gray-200'>
                    <button
                        onClick={() => setShowAll(true)}
                        className='w-full text-xs text-white hover:text-gray-300 py-2 rounded-md transition-colors duration-150 flex items-center justify-center gap-1.5'
                    >
                        <span className='transform transition-transform duration-200'>▾</span>
                        Show {featured.length + other.length - maxVisible} more loaders
                    </button>
                </div>
            )}

            {showCollapseButton && (
                <div className='pt-2 border-t border-gray-200'>
                    <button
                        onClick={() => setShowAll(false)}
                        className='w-full text-xs text-white hover:text-gray-300 py-2 rounded-md transition-colors duration-150 flex items-center justify-center gap-1.5'
                    >
                        <span className='transform transition-transform duration-200 rotate-180'>▾</span>
                        Show less
                    </button>
                </div>
            )}

            {/* Clear search button */}
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery('')}
                    className='w-full text-xs text-white hover:text-gray-300 py-1 border-t border-gray-200 mt-2'
                >
                    Clear search
                </button>
            )}
        </div>
    );
};

export default LoaderSelector;
