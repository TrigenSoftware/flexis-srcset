
interface IPlugin {}

interface IParams {
	plugins: IPlugin[];
}

type PluginParams = Record<string, any>;

export type PluginCreator = (params?: PluginParams) => IPlugin;

export function buffer(input: Buffer, params: IParams): Promise<Buffer>;
