import debounce from "debounce";
import { useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";

import Can from "@/components/elements/Can";
import ContentBox from "@/components/elements/ContentBox";
import { ModBox } from "@/components/elements/ModBox";
import PageContentBlock from "@/components/elements/PageContentBlock";

import LoaderSelector from "./LoaderSelector";
import { ModList } from "./ModList";
import GameVersionSelector from "./VersionSelector";
import {
	GlobalStateProvider,
	ModrinthService,
	appVersion,
	useGlobalStateContext,
} from "./config";

const ModrinthContainerInner = () => {
	const {
		mods,
		loaders,
		gameVersions,
		selectedLoaders,
		selectedVersions,
		searchQuery,
		setMods,
		setLoaders,
		setGameVersions,
		setSelectedLoaders,
		setSelectedVersions,
		setSearchQuery,
		updateGameVersions,
		updateLoaders,
	} = useGlobalStateContext();

	const [searchTerm, setSearchTerm] = useState(searchQuery);
	const [isLoadingLoader, setLoaderLoading] = useState(true);
	const [isLoadingVersion, setVersionLoading] = useState(true);
	const [isInitialized, setIsInitialized] = useState(false);

	const debouncedSetSearchTerm = useCallback(
		debounce((value: string) => {
			setSearchQuery(value);
		}, 500),
		[setSearchQuery],
	);

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setSearchTerm(value);
		debouncedSetSearchTerm(value);
	};

	// Initialize and load loaders/versions - ONLY ONCE
	useEffect(() => {
		const initialize = async () => {
			if (isInitialized) return;

			const initialized = await ModrinthService.init(appVersion);
			if (!initialized) {
				toast.error("Failed to initialize Modrinth API");
				return;
			}

			try {
				const [loaderResponse, versionResponse] = await Promise.all([
					ModrinthService.fetchLoaders(),
					ModrinthService.fetchGameVersions(),
				]);

				// Use the context updaters instead of direct setters
				updateLoaders(loaderResponse.data);
				updateGameVersions(versionResponse.data);

				// console.log('Game versions set:', versionResponse.data);
				// console.log('Loaders set:', loaderResponse.data);

				setLoaderLoading(false);
				setVersionLoading(false);
				setIsInitialized(true);
			} catch (error) {
				console.error("Initial fetch error:", error);
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to fetch initial data",
				);
				setLoaderLoading(false);
				setVersionLoading(false);
			}
		};

		initialize();
	}, [isInitialized, updateLoaders, updateGameVersions]);

	// Sync searchTerm with global searchQuery
	useEffect(() => {
		setSearchTerm(searchQuery);
	}, [searchQuery]);

	// console.log('Current state:', {
	//     loaders: loaders.length,
	//     gameVersions: gameVersions.length,
	//     selectedLoaders,
	//     selectedVersions,
	//     searchQuery,
	//     mods: mods.length,
	// });

	return (
		<PageContentBlock title={"Mods/Plugins"}>
			<Toaster />
			<ContentBox className="p-8 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-xs rounded-xl mb-5">
				{/* TODO: Add a navbar to cycle between Downloaded, Download, and Dependency resolver */}
			</ContentBox>
			<div className="flex flex-wrap gap-4">
				<ContentBox
					className="p-8 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-xs rounded-xl w-full md:w-1/6"
					title="Settings"
				>
					<Can action={"modrinth.loader"}>
						<ModBox>
							<ContentBox title="Loader" className="">
								{isLoadingLoader ? (
									<p>Loading loaders...</p>
								) : (
									<LoaderSelector />
								)}
							</ContentBox>
						</ModBox>
					</Can>
					<Can action={"modrinth.version"}>
						<ModBox>
							<ContentBox title="Version" className="scrollbar-thumb-red-700">
								{isLoadingVersion ? (
									<p>Loading versions...</p>
								) : (
									<GameVersionSelector />
								)}
							</ContentBox>
						</ModBox>
					</Can>
				</ContentBox>

				<ContentBox
					className="p-8 bg-[#ffffff09] border-[1px] border-[#ffffff11] shadow-xs rounded-xl w-full md:w-4/5"
					title="Downloader"
				>
					<div className="relative w-full h-full mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
							className="w-5 h-5 absolute top-1/2 -translate-y-1/2 left-5 opacity-40"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
							/>
						</svg>
						<input
							className="pl-14 pr-4 py-4 w-full rounded-lg bg-[#ffffff11] text-sm font-bold"
							type="text"
							placeholder="Search"
							value={searchTerm}
							onChange={handleInputChange}
						/>
					</div>
					<ModList />
				</ContentBox>
			</div>
		</PageContentBlock>
	);
};

const ModrinthContainer = () => {
	return (
		<GlobalStateProvider>
			<ModrinthContainerInner />
		</GlobalStateProvider>
	);
};

export default ModrinthContainer;
