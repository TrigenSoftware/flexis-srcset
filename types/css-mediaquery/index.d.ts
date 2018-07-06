
interface IParams {
	width?: number;
	height?: number;
}

export function match(query: string, params: IParams): boolean;
