export type CombinationVariant<T extends Record<string, unknown[]> = Record<string, unknown[]>> = {
	[K in keyof T]?: T[K][number]
};

/**
 * Make all possible combination of values.
 * @param states - Values.
 * @param optionIndex - Option index to start walk.
 * @returns All possible combinations.
 */
export function combineVariants<T extends Record<string, unknown[]>>(
	states: T,
	optionIndex = 0
): CombinationVariant<T>[] {
	const statesEntries = Object.entries(states);
	const statesEntriesLength = statesEntries.length;
	const [currentKey, currentValues] = statesEntries[optionIndex];
	let current: CombinationVariant<T> = {};
	const combinations = currentValues.reduce<CombinationVariant<T>[]>((combinations, value) => {
		current = {
			...current,
			[currentKey]: value
		};

		if (optionIndex + 1 < statesEntriesLength) {
			return [
				...combinations,
				...combineVariants(states, optionIndex + 1).map(_ => ({
					...current,
					..._
				}))
			];
		}

		return [...combinations, current];
	}, []);

	return combinations;
}
