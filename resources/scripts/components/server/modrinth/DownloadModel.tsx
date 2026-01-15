import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";

import Button from "../../elements/ButtonV2";

interface ApiFile {
	hashes: {
		sha512: string;
		sha1: string;
	};
	url: string;
	filename: string;
	primary: boolean;
	size: number;
	file_type: string | null;
}

interface Version {
	id: string;
	project_id: string;
	author_id: string;
	featured: boolean;
	name: string;
	version_number: string;
	changelog: string;
	changelog_url: string | null;
	date_published: string;
	downloads: number;
	version_type: string;
	status: string;
	requested_status: string | null;
	files: ApiFile[];
	game_versions: string[];
	loaders: string[];
}

interface DropdownButtonProps {
	versions: Version[];
	onVersionSelect?: (version: Version) => void;
	className?: string;
}

const formatFileSize = (bytes: number): string => {
	const units = ["B", "KB", "MB", "GB"];
	let size = bytes;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}

	return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const DropdownButton = ({
	versions,
	onVersionSelect,
	className = "",
}: DropdownButtonProps) => {
	const [selectedVersion, setSelectedVersion] = useState<Version | null>(
		versions[0] || null,
	);
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelect = async (version: Version) => {
		setIsLoading(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate async operation
			setSelectedVersion(version);
			setIsOpen(false);
			onVersionSelect?.(version);
		} finally {
			setIsLoading(false);
		}
	};

	// Fallback UI if no versions are provided
	if (!versions.length) {
		return (
			<div className={`relative flex justify-center ${className}`}>
				<div className="relative w-full max-w-md">
					<Button
						variant="outline"
						className="flex items-center justify-between w-full px-4 py-3 text-left bg-gray-900 border-gray-700 hover:bg-gray-800 transition-colors disabled:opacity-50"
						disabled
					>
						<span className="font-medium truncate">No versions available</span>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`relative flex justify-center ${className}`}
			ref={dropdownRef}
		>
			<div className="relative w-full max-w-md">
				<Button
					ref={buttonRef}
					variant="outline"
					className="flex items-center justify-between w-full px-4 py-3 text-left bg-gray-900 border-gray-700 hover:bg-gray-800 transition-colors disabled:opacity-50"
					onClick={() => setIsOpen(!isOpen)}
					aria-haspopup="listbox"
					aria-expanded={isOpen}
					disabled={isLoading || !selectedVersion}
				>
					<div className="flex flex-col">
						<span className="font-medium truncate">
							Version: {selectedVersion?.version_number || "Select a version"}
						</span>
						{selectedVersion?.files?.[0]?.size && (
							<span className="text-xs text-gray-400">
								({formatFileSize(selectedVersion.files[0].size)})
							</span>
						)}
					</div>
					<ChevronDownIcon
						className={`w-5 h-5 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
					/>
				</Button>

				{isOpen && (
					<div
						className="absolute z-20 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto"
						role="listbox"
					>
						{versions.map((version) => (
							<div
								key={version.id}
								role="option"
								aria-selected={version.id === selectedVersion?.id}
								className={`px-4 py-3 cursor-pointer transition-colors ${
									version.id === selectedVersion?.id
										? "bg-brand text-white"
										: "hover:bg-gray-700"
								} focus:outline-none focus:bg-gray-700`}
								onClick={() => handleSelect(version)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleSelect(version);
									}
								}}
								tabIndex={0}
							>
								<div className="flex flex-col">
									<div className="flex justify-between items-center">
										<span className="font-medium">
											{version.version_number}
										</span>
										<span className="text-xs text-gray-400">
											{new Date(version.date_published).toLocaleDateString()}
										</span>
									</div>
									{version.name && (
										<span className="text-sm text-gray-300 truncate">
											{version.name}
										</span>
									)}
									<div className="flex gap-2 mt-1 text-xs text-gray-400">
										{version.files?.[0]?.file_type && (
											<span>Type: {version.files[0].file_type}</span>
										)}
										{version.files?.[0]?.size && (
											<span>Size: {formatFileSize(version.files[0].size)}</span>
										)}
										{version.game_versions?.length > 0 && (
											<span>Game: {version.game_versions[0]}</span>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-lg">
					<div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
				</div>
			)}
		</div>
	);
};

export default DropdownButton;
