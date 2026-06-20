import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { range } from '../src/range.js'

describe('Iterator.range', () => {
	it('numbers', () => {
		assert.deepEqual([ ...range(-1, 5) ], [ -1, 0, 1, 2, 3, 4 ])
		assert.deepEqual([ ...range(-5, 1) ], [ -5, -4, -3, -2, -1, 0 ])
		assert.deepEqual([ ...range(0, 0) ], [ ])
		assert.deepEqual([ ...range(0, -5, 1) ], [ ])

		// assert.deepEqual(
		// 	[ ...range(2 ** 53 - 1, 2 ** 53, { inclusive: true }) ],
		// 	[ 9007199254740991, 9007199254740992 ])
	})

	it('bigint', () => {
		// assert.deepEqual([ ...range(-1n, 5n) ], [ -1n, 0n, 1n, 2n, 3n, 4n ])
		// assert.deepEqual([ ...range(-5n, 1n) ], [ -5n, -4n, -3n, -2n, -1n, 0n ])
	})

	it('to Infinity', () => {
		let q = 0
		for (const i of range(0, Infinity)) {
			q += i
			if (i >= 100) break
		}

		assert.equal(q, 5050)
	})

	it('should support helpers', () => {
		assert.deepEqual([ ...range(0, 10).take(5) ], [ 0, 1, 2, 3, 4 ])
		assert.deepEqual([ ...range(0, 10).map(x => x * 2) ], [ 0, 2, 4, 6, 8, 10, 12, 14, 16, 18 ])
		assert.equal(range(0, 10).reduce((prev, curr) => prev + curr, 0), 45)
	})

	it('should throw on NaN', () => {
		assert.throws(() => [ ...range(NaN, 0) ], { name: 'RangeError' })
		assert.throws(() => [ ...range(0, NaN) ], { name: 'RangeError' })
		assert.throws(() => [ ...range(0, 0, NaN) ], { name: 'RangeError' })
		assert.throws(() => [ ...range(0, 0, { step: NaN }) ], { name: 'RangeError' })
	})

	// it('should infer step', () => {
	// 	assert.deepEqual([ ...range(0, -2) ], [ 0, -1 ])
	// 	assert.deepEqual([ ...range(0, -2, { inclusive: true }) ], [ 0, -1, -2 ])
	// })

	it('should throw on Zero step', () => {
		assert.throws(() => [ ...range(0, 10, 0) ], { name: 'TypeError'})
		assert.throws(() => [ ...range(0, 10, { step: 0 }) ], { name: 'TypeError'})
	})

	it('should throw on Infinity start or step', () => {
		assert.throws(() => [ ...range(Infinity, 10) ], { name: 'TypeError'})
		assert.throws(() => [ ...range(-Infinity, 10, { step: 0 }) ], { name: 'TypeError'})
		assert.throws(() => [ ...range(0, 10, Infinity) ], { name: 'TypeError'})
		assert.throws(() => [ ...range(0, 10, { step: Infinity }) ], { name: 'TypeError'})
	})

	it('should be inclusive on same start end value', () => {
		assert.deepEqual([ ...range(0, 0, { inclusive: true }) ], [ 0 ])
	})
})
