import type { IconSvgElement } from "@hugeicons/react";
import { memo, type RefObject, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";

import NavItem from "./NavItem";
import "./sidebar-logo.css";
import "./sidebar-modern.css";

interface NavItem {
	to: string;
	icon: IconSvgElement;
	text: string;
	minimizedText?: string;
	tabName: string;
	ref: RefObject<HTMLAnchorElement | null>;
	end: boolean;
	permission?: string | string[];
}

interface SidebarProps {
	navItems: NavItem[];
	className?: string;
	onNavClick?: () => void;
}

export default memo(function Sidebar({
	navItems,
	className,
	onNavClick,
}: SidebarProps) {
	const location = useLocation();

	// dynamic CSS for hover and active states on mount
	useEffect(() => {
		const styleId = "sidebar-dynamic-styles";

		const existingStyle = document.getElementById(styleId);
		if (existingStyle) {
			existingStyle.remove();
		}

		const maxItems = navItems.length;
		let css = "";

		// hover effects for indicator positioning
		for (let i = 1; i <= maxItems; i++) {
			css += `
                .sidebar-container:has(li:nth-child(${i}):hover) .sidebar-indicator {
                    top: calc(var(--sidebar-initial-top) + (var(--nav-item-height) + var(--nav-item-spacing)) * ${i - 1}) !important;
                }
            `;
		}

		// active indicator positions
		for (let i = 1; i <= maxItems; i++) {
			css += `
                .sidebar-container:not(:has(li:hover)):has(li[data-active='true']:nth-child(${i})) .sidebar-indicator {
                    top: calc(var(--sidebar-initial-top) + (var(--nav-item-height) + var(--nav-item-spacing)) * ${i - 1}) !important;
                }
            `;
		}

		// inject
		const styleElement = document.createElement("style");
		styleElement.id = styleId;
		styleElement.textContent = css;
		document.head.appendChild(styleElement);

		// cleanup
		return () => {
			const style = document.getElementById(styleId);
			if (style) {
				style.remove();
			}
		};
	}, [navItems.length]);

	// stable path to tab mapping
	const pathToTabMapping = useMemo(() => {
		return navItems.map((item) => ({
			pattern: (path: string) => {
				if (item.to === "/" && item.end) {
					return path.endsWith("/");
				}
				return path.endsWith(item.to);
			},
			tabName: item.tabName,
			ref: item.ref,
		}));
	}, [navItems]);

	// current active tab
	const currentActiveTab = useMemo(() => {
		const match = pathToTabMapping.find(({ pattern }) =>
			pattern(location.pathname),
		);
		return match?.tabName || null;
	}, [pathToTabMapping, location.pathname]);

	// stable callback for nav clicks
	const handleNavClick = useCallback(() => {
		onNavClick?.();
	}, [onNavClick]);

	return (
		<div
			className={cn(
				"sidebar-container flex-col shrink-0 rounded-lg px-8 select-none overflow-y-auto relative",
				className,
			)}
		>
			<div className="sidebar-indicator absolute bg-mocha-400 border border-mocha-300 left-[2rem] rounded-xl pointer-events-none" />
			<ul className="flex flex-col text-sm">
				{navItems.map((item, index) => {
					const isActive = currentActiveTab === item.tabName;
					return (
						<li
							key={item.tabName}
							data-tab={item.tabName}
							data-active={isActive}
						>
							<NavItem
								to={item.to}
								icon={item.icon}
								text={item.text}
								itemRef={item.ref}
								end={item.end}
								lastItem={index === navItems.length - 1}
								permission={item.permission}
								onNavClick={handleNavClick}
							/>
						</li>
					);
				})}
			</ul>
		</div>
	);
});
