"use client";

import Flags from "./flags/index";

const Flag = (props: {
	code: keyof typeof Flags | string;
	width?: number;
	alt?: string;
	height?: number;
}) => {
	return (
		<img
			src={Flags[props.code.toUpperCase() as keyof typeof Flags]}
			alt={props.alt || `${props.code} flag`}
			width={props.width || 20}
			height={props.height || 20}
			className="mr-2 inline-block"
		/>
	);
};

export default Flag;
