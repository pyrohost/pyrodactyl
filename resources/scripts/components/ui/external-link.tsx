export const ExternalLink = ({
	href,
	children,
	className = "",
}: {
	href: string;
	children: React.ReactNode;
	className?: string;
}) => {
	const isExternal = href.startsWith("http");
	const linkProps = isExternal
		? {
				href: `/external-redirect?to=${encodeURIComponent(href)}`,
				target: "_blank",
				rel: "noopener noreferrer",
			}
		: {
				href,
			};

	return (
		<a
			{...linkProps}
			className={`underline hover:text-brand-500/80 ${className}`}
		>
			{children}
		</a>
	);
};
