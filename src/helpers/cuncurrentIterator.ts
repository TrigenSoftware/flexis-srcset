import {
	cpus
} from 'os';
import pLimit from 'p-limit';

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type IteratorHandler<TItem, TData = unknown> = (item: TItem, index: number) => (void | Promise<void> | AsyncGenerator<TData>);

export function cuncurrentIterator<TItem, TData>(
	items: TItem[],
	handler: IteratorHandler<TItem, TData>,
	concurrency = cpus().length
) {
	return {
		async *[Symbol.asyncIterator]() {
			const limit = pLimit(concurrency);
			const tasks = items.map((item, i) => limit(async () => {
				const handlerResult = await handler(item, i);
				const results: TData[] = [];

				if (typeof handlerResult === 'undefined') {
					return results;
				}

				for await (const data of handlerResult) {
					results.push(data);
				}

				return results;
			}));

			for (const task of tasks) {
				const results = await task;

				yield *results;
			}
		}
	};
}
