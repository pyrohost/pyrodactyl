import { cn } from "@/lib/utils";

interface ChartBlockProps {
	title: string;
	legend?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

// eslint-disable-next-line react/display-name
export default ({ title, legend, children, className }: ChartBlockProps) => (
	<div
		className={cn(
			"group p-4 relative rounded-xl border-[1px] border-[#ffffff11] bg-[#110f0d] flex flex-col gap-2",
			className,
		)}
	>
		<div className={"flex items-center justify-between"}>
			<h3 className={"font-extrabold text-sm"}>{title}</h3>
			{legend && <div className={"text-sm flex items-center"}>{legend}</div>}
		</div>
		<div className={"z-10 overflow-hidden rounded-lg"}>{children}</div>
	</div>
);
