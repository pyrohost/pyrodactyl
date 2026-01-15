import * as React from "react";

import { cn } from "../../lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex h-10 w-full rounded-full border border-mocha-400 bg-mocha-600 px-3 py-1 text-sm text-cream-400 transition file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-cream-400/30 focus-visible:ring-1 focus-visible:ring-mocha-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
