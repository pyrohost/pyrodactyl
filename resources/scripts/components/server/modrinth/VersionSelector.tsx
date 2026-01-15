import { useMemo, useState } from "react";

import { Checkbox } from "@/components/elements/CheckboxLabel";
import Input from "@/components/elements/Input";

import { useGlobalStateContext } from "./config";

export const VersionSelector = () => {
	const { gameVersions, selectedVersions, setSelectedVersions } =
		useGlobalStateContext();
	const [showSnapshots, setShowSnapshots] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	// Filter versions based on showSnapshots and search
	const filteredVersions = useMemo(() => {
		let versions = showSnapshots
			? gameVersions
			: gameVersions.filter((v) => v.type !== "snapshot");

		// Apply search filter if query exists
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			versions = versions.filter(
				(version) =>
					version.name.toLowerCase().includes(query) ||
					version.id.toLowerCase().includes(query) ||
					version.type.toLowerCase().includes(query),
			);
		}

		return versions;
	}, [gameVersions, showSnapshots, searchQuery]);

	// Group versions by type for better organization
	const { releases, snapshots, betas } = useMemo(() => {
		const releases = filteredVersions.filter((v) => v.type === "release");
		const snapshots = filteredVersions.filter((v) => v.type === "snapshot");
		const betas = filteredVersions.filter((v) => v.type === "beta");

		return { releases, snapshots, betas };
	}, [filteredVersions]);

	const hasSearchResults = filteredVersions.length > 0;
	const hasReleases = releases.length > 0;
	const hasSnapshots = snapshots.length > 0;
	const hasBetas = betas.length > 0;

	return (
		<div className="space-y-3">
			{/* Search Input */}
			<div className="relative">
				<Input
					type="text"
					placeholder="Search versions..."
					value={searchQuery}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setSearchQuery(e.target.value)
					}
					className="w-full pl-3 pr-8 py-1 text-sm"
				/>
				{searchQuery && (
					<button
						onClick={() => setSearchQuery("")}
						className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
					>
						✕
					</button>
				)}
			</div>

			{gameVersions.length === 0 ? (
				<p className="text-sm text-gray-500">No versions available</p>
			) : !hasSearchResults ? (
				<p className="text-sm text-gray-500 text-center py-2">
					No versions found matching &quot;{searchQuery}&quot;
				</p>
			) : (
				<>
					<div className="space-y-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-100">
						{/* Show releases first */}
						{hasReleases && (
							<div className="space-y-1">
								{!searchQuery && (
									<p className="text-xs text-gray-500 font-medium">Releases</p>
								)}
								{releases.map((version) => (
									<Checkbox
										key={version.id}
										label={version.name}
										checked={selectedVersions.includes(version.id)}
										onChange={(isChecked) => {
											const newSelected = isChecked
												? [...selectedVersions, version.id]
												: selectedVersions.filter((id) => id !== version.id);
											setSelectedVersions(newSelected);
										}}
									/>
								))}
							</div>
						)}

						{/* Show snapshots if enabled or searching */}
						{(showSnapshots || searchQuery) && hasSnapshots && (
							<div className="space-y-1">
								{!searchQuery && (
									<p className="text-xs text-gray-500 font-medium pt-1">
										Snapshots
									</p>
								)}
								{snapshots.map((version) => (
									<Checkbox
										key={version.id}
										label={version.name}
										checked={selectedVersions.includes(version.id)}
										onChange={(isChecked) => {
											const newSelected = isChecked
												? [...selectedVersions, version.id]
												: selectedVersions.filter((id) => id !== version.id);
											setSelectedVersions(newSelected);
										}}
									/>
								))}
							</div>
						)}

						{/* Show betas */}
						{hasBetas && (
							<div className="space-y-1">
								{!searchQuery && (
									<p className="text-xs text-gray-500 font-medium pt-1">
										Betas
									</p>
								)}
								{betas.map((version) => (
									<Checkbox
										key={version.id}
										label={version.name}
										checked={selectedVersions.includes(version.id)}
										onChange={(isChecked) => {
											const newSelected = isChecked
												? [...selectedVersions, version.id]
												: selectedVersions.filter((id) => id !== version.id);
											setSelectedVersions(newSelected);
										}}
									/>
								))}
							</div>
						)}
					</div>

					<div className="flex justify-between items-center pt-1 border-t border-gray-200">
						<span className="text-xs text-gray-500">
							{selectedVersions.length} selected
						</span>

						{searchQuery && (
							<button
								onClick={() => setSearchQuery("")}
								className="text-xs text-gray-600 hover:text-gray-800 font-medium"
							>
								Clear search
							</button>
						)}
					</div>

					{!searchQuery && (
						<div className="pt-1 border-t border-gray-200">
							<button
								onClick={() => setShowSnapshots((prev) => !prev)}
								className="w-full text-xs text-white-600 hover:text-gray-300 font-medium py-1 flex items-center justify-center gap-1"
							>
								<span>{showSnapshots ? "-" : "+"}</span>
								{showSnapshots ? "Hide Snapshots" : "Show Snapshots"}
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default VersionSelector;
