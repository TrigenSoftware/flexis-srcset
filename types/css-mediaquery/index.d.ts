
interface Params {
	width?: number;
	height?: number;
}

export function match(query: string, params: Params): boolean;
