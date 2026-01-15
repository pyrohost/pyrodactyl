"use client";

import React, { useEffect, useState } from "react";

import { cn } from "../../lib/utils";

// million-ignore
const CommandIcon = (props: React.SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="12"
		height="12"
		fill="none"
		{...props}
	>
		<path
			d="M15 9V15H9V9H15Z"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
		/>
		<path
			d="M15 15H18C19.6569 15 21 16.3431 21 18C21 19.6569 19.6569 21 18 21C16.3431 21 15 19.6569 15 18V15Z"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
		/>
		<path
			d="M9 15.002H6C4.34315 15.002 3 16.3451 3 18.002C3 19.6588 4.34315 21.002 6 21.002C7.65685 21.002 9 19.6588 9 18.002V15.002Z"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
		/>
		<path
			d="M15 9L15 6C15 4.34315 16.3431 3 18 3C19.6569 3 21 4.34315 21 6C21 7.65685 19.6569 9 18 9H15Z"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
		/>
		<path
			d="M9 9V6C9 4.34315 7.65685 3 6 3C4.34315 3 3 4.34315 3 6C3 7.65685 4.34315 9 6 9H9Z"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
		/>
	</svg>
);

interface KeyboardShortcutProps {
	keys: string[];
	className?: string;
	variant?: "default" | "faded";
}

export const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({
	keys,
	className,
	variant = "default",
}) => {
	const [platform, setPlatform] = useState<"mac" | "pc">("pc");
	const textColor =
		variant === "faded" ? "text-cream-400/30" : "text-cream-400";

	useEffect(() => {
		const isMac =
			navigator.platform.toUpperCase().indexOf("MAC") >= 0 ||
			navigator.userAgent.includes("Mac");
		setPlatform(isMac ? "mac" : "pc");
	}, []);

	const renderKey = (key: string) => {
		if (key === "cmd" || key === "ctrl") {
			return platform === "mac" ? (
				<CommandIcon />
			) : (
				<span className={`text-xs ${textColor}`}>Ctrl</span>
			);
		}
		return <span className={`text-xs ${textColor}`}>{key.toUpperCase()}</span>;
	};

	const getKeyStyles = () => {
		if (variant === "faded") {
			return "border border-cream-400/30 bg-transparent";
		}
		return "border border-mocha-300 bg-mocha-400";
	};

	return (
		<div
			className={cn(
				"inline-flex items-center gap-1 text-sm font-semibold select-none",
				className,
			)}
		>
			{keys.map((key, index) => (
				<React.Fragment key={index}>
					{index > 0 && <span className={textColor}>+</span>}
					<div
						className={cn(
							"grid h-5 min-w-5 place-content-center items-center justify-center rounded-lg px-1",
							textColor,
							getKeyStyles(),
						)}
					>
						{renderKey(key)}
					</div>
				</React.Fragment>
			))}
		</div>
	);
};

export default KeyboardShortcut;
