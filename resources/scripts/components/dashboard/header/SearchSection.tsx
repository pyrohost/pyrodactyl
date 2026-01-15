import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { memo, useState } from "react";

import { Input } from "@/components/ui/input";
import { KeyboardShortcut } from "@/components/ui/keyboard-shortcut";

const SearchIcon = memo(() => (
	<HugeiconsIcon
		size={16}
		strokeWidth={2}
		icon={Search01Icon}
		className="absolute top-1/2 left-4 -translate-y-1/2 transform text-cream-500/30"
	/>
));
SearchIcon.displayName = "SearchIcon";

interface SearchSectionProps {
	className?: string;
}

const SearchSection = memo(({ className }: SearchSectionProps) => {
	const [searchValue, setSearchValue] = useState("");

	return (
		<div className={`flex items-center gap-2 h-full ${className || ""}`}>
			<div className="relative w-full">
				<Input
					id="header-search"
					type="text"
					placeholder="Search servers..."
					value={searchValue}
					onChange={(e) => {
						setSearchValue(e.target.value);
					}}
					className="pl-10 pr-16"
				/>
				<SearchIcon />
				{!searchValue && (
					<div className="absolute top-1/2 right-4 -translate-y-1/2 transform flex align-middle pointer-events-none">
						<KeyboardShortcut keys={["cmd", "k"]} variant="faded" />
					</div>
				)}
			</div>
		</div>
	);
});

SearchSection.displayName = "SearchSection";

export default SearchSection;
