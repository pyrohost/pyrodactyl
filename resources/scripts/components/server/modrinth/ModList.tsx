import { useEffect, useState } from "react";
import { toast } from "sonner";

import ActionButton from "@/components/elements/ActionButton";
import ContentBox from "@/components/elements/ContentBox";

import { ModCard } from "./ModCard";
import { ModrinthService, useGlobalStateContext } from "./config";

interface ModListProps {
	showInstalled?: boolean;
	showDependencies?: boolean;
}

export const ModList = ({
	showInstalled = false,
	showDependencies = false,
}: ModListProps) => {
	const { mods, setMods, selectedLoaders, selectedVersions, searchQuery } =
		useGlobalStateContext();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);

	const fetchMods = async (resetPagination = false) => {
		if (isLoading) return;

		try {
			setIsLoading(true);
			setError(null);

			const currentPage = resetPagination ? 0 : page;

			const facets: string[][] = [["project_type:mod"]];

			if (selectedLoaders.length > 0) {
				selectedLoaders.forEach((loader) => {
					facets.push([`categories:${loader}`]);
				});
			}

			if (selectedVersions.length > 0) {
				selectedVersions.forEach((version) => {
					facets.push([`versions:${version}`]);
				});
			}
			facets.push(["server_side:required", "server_side:optional"]);

			// console.log('Fetching mods with parameters:', {
			//     query: searchQuery,
			//     facets: facets,
			//     selectedLoaders,
			//     selectedVersions,
			//     page: currentPage,
			// });

			const { data } = await ModrinthService.searchMods({
				query: searchQuery || undefined,
				facets: facets,
				limit: 20,
				offset: currentPage,
				index: "relevance",
			});

			// console.log('Fetched mods:', data.length, 'first mod:', data[0]);

			if (resetPagination) {
				setMods(data);
				setPage(0);
			} else {
				setMods((prev) => [...prev, ...data]);
			}
			setHasMore(data.length >= 20);
		} catch (err) {
			setError("Failed to load mods. Please try again later.");
			console.error("Mod fetch error:", err);
			toast.error(err instanceof Error ? err.message : "Failed to fetch mods");
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch mods when filters change
	useEffect(() => {
		// console.log('Filters changed, fetching mods:', {
		//     selectedLoaders,
		//     selectedVersions,
		//     searchQuery,
		// });
		fetchMods(true);
	}, [selectedLoaders.join(","), selectedVersions.join(","), searchQuery]);

	const handleLoadMore = () => {
		if (!isLoading && hasMore) {
			setPage((prev) => prev + 20);
			fetchMods(false);
		}
	};

	if (isLoading && mods.length === 0) return <LoadingSpinner />;
	if (error) return <ErrorDisplay message={error} />;
	if (mods.length === 0) return <EmptyState />;

	return (
		<div className="space-y-6">
			<div className="text-sm text-gray-400 px-2 py-1 bg-gray-800/50 rounded-lg inline-block">
				Showing {mods.length} {showInstalled ? "plugins" : "mods"}
				{searchQuery && (
					<span className="text-gray-300">
						{" "}
						for &quot;<span className="text-blue-400">{searchQuery}</span>&quot;
					</span>
				)}
				{/* TODO: Make this have a tooltip with selected Filters  */}
				{/* TODO: Add a filter reset button */}
				{(selectedLoaders.length > 0 || selectedVersions.length > 0) && (
					<span className="text-gray-300">{" with filters"}</span>
				)}
			</div>

			<div className="grid gap-4">
				{mods.map((mod) => (
					<ModCard key={`${mod.id}-${mod.latest_version}`} mod={mod} />
				))}
			</div>

			{/* {hasMore && ( */}
			{/*     <ActionButton */}
			{/*         onClick={handleLoadMore} */}
			{/*         disabled={isLoading} */}
			{/*         className={`${isLoading */}
			{/*                 ? 'bg-gray-700 cursor-not-allowed' */}
			{/*                 : 'bg-blue-600 hover:bg-blue-500 shadow-lg hover:shadow-blue-500/20' */}
			{/*             } text-white font-medium`} */}
			{/*     > */}
			{/*         {isLoading ? ( */}
			{/*             <span className='inline-flex items-center'> */}
			{/*                 <svg */}
			{/*                     className='animate-spin -ml-1 mr-2 h-4 w-4 text-white' */}
			{/*                     xmlns='http://www.w3.org/2000/svg' */}
			{/*                     fill='none' */}
			{/*                     viewBox='0 0 24 24' */}
			{/*                 > */}
			{/*                     <circle */}
			{/*                         className='opacity-25' */}
			{/*                         cx='12' */}
			{/*                         cy='12' */}
			{/*                         r='10' */}
			{/*                         stroke='currentColor' */}
			{/*                         strokeWidth='4' */}
			{/*                     ></circle> */}
			{/*                     <path */}
			{/*                         className='opacity-75' */}
			{/*                         fill='currentColor' */}
			{/*                         d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' */}
			{/*                     ></path> */}
			{/*                 </svg> */}
			{/*                 Loading... */}
			{/*             </span> */}
			{/*         ) : ( */}
			{/*             'Load More' */}
			{/*         )} */}
			{/*     </ActionButton> */}
			{/* )} */}
		</div>
	);
};

const LoadingSpinner = () => (
	<ContentBox>
		<div className="flex justify-center py-8">
			<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand"></div>
		</div>
	</ContentBox>
);

const ErrorDisplay = ({ message }: { message: string }) => (
	<ContentBox>
		<div className="text-red-500 p-4">{message}</div>
	</ContentBox>
);

const EmptyState = () => (
	<ContentBox>
		<div className="text-gray-400 p-4 text-center">
			No mods found matching your criteria
		</div>
	</ContentBox>
);
