"use client";

import { ArrowDownToLine } from "@gravity-ui/icons";
import { Link } from "react-router-dom";

import ActionButton from "@/components/elements/ActionButton";
import Button from "@/components/elements/ButtonV2";

// import { ServerContext } from '@/state/server';

import type { Mod } from "./config";

interface ModCardProps {
	mod: Mod;
}

export const ModCard = ({ mod }: ModCardProps) => {
	// const eggFeatures = ServerContext.useStoreState((state) => state.server.data?.eggFeatures);
	const formatDownloads = (num: number) => {
		if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
		if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
		return num.toString();
	};

	return (
		<div className="group bg-gradient-to-br from-[#090909] via-[#0f0f0f] to-[#131313] transition delay-50 duration-325  rounded-xl overflow-hidden border border-gray-800/70 hover:border-brand/60 transition-all duration-300 hover:shadow-2xl hover:shadow-brand/15 backdrop-blur-sm">
			<div className="p-6 flex items-start space-x-5">
				{/* Icon Container */}
				<div className="flex-shrink-0 relative hover:cursor-pointer hover:scale-105 transition-transform duration-300">
					{mod.icon_url ? (
						<div className="relative ">
							<a href={`${mod.id}`}>
								<img
									src={mod.icon_url}
									alt={mod.title}
									className="w-20 h-20 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300 border border-gray-700/50"
								/>
							</a>
							<div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/30 to-transparent" />
						</div>
					) : (
						<div className="w-20 h-20 bg-gradient-to-br from-[#131313] to-[#1a1a1a] rounded-xl flex items-center justify-center shadow-inner border border-gray-700/30">
							<span className="text-gray-400 text-sm font-medium">No Icon</span>
						</div>
					)}
				</div>

				{/* Content */}
				<div className="flex-1 min-w-0 space-y-3">
					<div>
						<Link
							to={`${mod.id}`}
							className="text-xl font-bold text-white hover:text-brand/50 transition-colors duration-200 line-clamp-1 group-hover:underline"
						>
							{mod.title}
						</Link>
						<p className="text-sm text-gray-400 mt-1 font-medium">
							by {mod.author}
						</p>
					</div>

					<p className="text-gray-500 leading-relaxed line-clamp-2 text-sm">
						{mod.description}
					</p>

					{/* Stats */}
					<div className="flex items-center space-x-6 text-sm">
						<div className="flex items-center space-x-2 text-gray-400">
							<svg
								className="w-4 h-4 text-brand"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
							<span className="font-semibold text-gray-300">
								downloads: {formatDownloads(mod.downloads)}
							</span>
						</div>

						<div className="flex items-center space-x-2 text-gray-400">
							<svg
								className="w-4 h-4 text-green-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<span className="font-semibold text-gray-300">
								latest: {mod.latest_version}
							</span>
						</div>
					</div>
				</div>

				<div className="flex-shrink-0 self-center align-text-left">
					<Button className="border-gray-500/70 border-2 rounded-md transition delay-50 duration-325 hover:border-brand/50 hover:text-gray-200 ">
						<ArrowDownToLine width={22} height={22} className="px-1" />
						Install
					</Button>
				</div>
			</div>
		</div>
	);
};
