import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

const SecondaryLink = ({
	children,
	className,
	to,
	...props
}: {
	children: React.ReactNode;
	className?: string;
	to: string;
}) => {
	return (
		<Link
			{...props}
			to={to}
			className={cn(
				className,
				"text-sm text-secondary tracking-wide underline hover:text-primary transition-colors",
			)}
		>
			{children}
		</Link>
	);
};
SecondaryLink.displayName = "SecondaryLink";

export default SecondaryLink;
