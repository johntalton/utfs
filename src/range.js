// Object.defineProperty(Iterator, 'range', {
// 	configurable: true,
// 	writable: true,
// 	value: range,
// })

/**
 * @typedef {Object} RangeOptions
 * @property {boolean|undefined} [inclusive]
 * @property {number|undefined} [step]
 */

/**
 * @param {number} start
 * @param {number} end
 * @param {Partial<RangeOptions>|number|undefined} [optionsOrStep]
 */
export function *range(start, end, optionsOrStep) {
	const isOptions = (optionsOrStep === undefined) || typeof optionsOrStep !== 'number'
	const step = (isOptions ? optionsOrStep?.step : optionsOrStep) ?? 1
	const inclusive = (isOptions ? optionsOrStep?.inclusive : false) ?? false

	if(Number.isNaN(start)) { throw new RangeError('start is NaN') }
	if(Number.isNaN(end)) { throw new RangeError('end is Nan') }
	if(Number.isNaN(step)) { throw new RangeError('step is NaN') }
	if(step === 0) { throw new TypeError('step is Zero') }

	if(!Number.isFinite(start)) { throw new TypeError('start is not finite') }
	if(!Number.isFinite(step)) { throw new TypeError('step is not finite') }

	if(inclusive) {
		for(let i = start; i <= end; i += step) { yield i }
	}

	for(let i = start; i < end; i += step) { yield i }
}

