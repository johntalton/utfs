import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { UTFS, UTFS_FLAGS, UTFS_OPTIONS, UTFS_RESULT } from '@johntalton/utfs'

describe('UTFS', () => {
	describe('init', () => {
		it('should throw on empty', () => {
			assert.throws(() => {
				const fs = UTFS.init(undefined)
			})
		})

		it('should throw on missing readFn', () => {
			assert.throws(() => {
				const fs = UTFS.init({
					readFn: undefined,
					writeFn: () => 0
				})
			}, {
				message: 'readFn undefined'
			})
		})

		it('should throw on missing writeFn', () => {
			assert.throws(() => {
				const fs = UTFS.init({
					readFn: () => Uint8Array.from([]),
					writeFn: undefined
				})
			}, {
				message: 'writeFn undefined'
			})
		})

		it('should return default fs', () => {
			const fs = UTFS.init({
				readFn:  () => Uint8Array.from([]),
				writeFn: () => 0
			})

			assert.equal(fs.baseAddress, 0)
			assert.deepEqual(fs.file_list, [])
		})
	})

	describe('register', () => {
		it('should register single file', () => {
			const fs = UTFS.init({
				readFn:  () => Uint8Array.from([]),
				writeFn: () => 0
			})

			const file = {
				filename: 'test',
				signature: 0,
				size: 0,
				size_loaded: 0,
				data: undefined,
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const result = UTFS.register(fs, file, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(result, UTFS_RESULT.RES_OK)

			assert.equal(fs.structure_saved, false)
			assert.equal(fs.file_list.length, 1)
			assert.equal(fs.file_list[0], file)
		})
	})

	describe('unregister', () => {
		it('should ', () => {})
	})

	describe('load', () => {
		it('should reject from empty buffer', async () => {
			const fs = UTFS.init({
				readFn:  async () => new Uint8Array(0),
				writeFn: async () => 0
			})

			assert.rejects(async () => {
				const status = await UTFS.load(fs)
			})
		})

		it('should fail to load from zeroed buffer', async () => {
			const fs = UTFS.init({
				readFn:  async () => new Uint8Array(24),
				writeFn: async () => 0
			})

			const status = await UTFS.load(fs)
			assert.equal(status, UTFS_RESULT.RES_INVALID_FS)
		})

		it('should load with valid initial header (no file match)', async () => {
			const buffer = new Uint8Array(24)
			buffer[0] = 0x19
			buffer[1] = 0x84
			buffer[2] = 0x01

			const fs = UTFS.init({
				readFn:  async () => buffer,
				writeFn: async () => 0
			})

			const status = await UTFS.load(fs)
			assert.equal(status, UTFS_RESULT.RES_OK)
		})

		it('should load with and match file (skip null data)', async () => {
			const buffer = new Uint8Array(24 + 1)
			buffer[0] = 0x19
			buffer[1] = 0x84
			buffer[2] = 0x01

			const encoder = new TextEncoder()
			const filenameBuffer = new Uint8Array(buffer.buffer, 12)
			encoder.encodeInto('test', filenameBuffer)


			const fs = UTFS.init({
				// verbose: true,
				readFn:  async (offset, length) => offset === 0 ? buffer : new Uint8Array(24),
				writeFn: async () => 0
			})

			const file = {
				filename: 'test',
				signature: 0,
				size: 0,
				size_loaded: 0,
				data: undefined,
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const result = UTFS.register(fs, file, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)

			// console.log(fs.file_list)

			const status = await UTFS.load(fs)
			assert.equal(status, UTFS_RESULT.RES_OK)

			assert.equal(fs.file_list[0]?.size_loaded, 0)
			assert.equal(fs.file_list[0]?.signature, 0)
		})

		it('should load with and match file', async () => {
			const buffer = new Uint8Array(24)
			buffer[0] = 0x19
			buffer[1] = 0x84
			buffer[2] = 0x01
			// flags
			// sig
			// reserved
			buffer[8 + 3] = 3


			const encoder = new TextEncoder()
			const filenameBuffer = new Uint8Array(buffer.buffer, 12)
			encoder.encodeInto('test', filenameBuffer)


			const fs = UTFS.init({
				// verbose: true,
				readFn:  async (offset, length) => {
					if(offset === 0) return buffer
					if(offset === 24) return Uint8Array.from([ 42, 77, 0 ])
					return new Uint8Array(24)
				},
				writeFn: async () => 0
			})

			const file = {
				filename: 'test',
				signature: 0,
				size: 3,
				size_loaded: 0,
				data: Uint8Array.from([ 42, 77, 0 ]),
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const result = UTFS.register(fs, file, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)

			// console.log(fs.file_list)

			const status = await UTFS.load(fs)
			assert.equal(status, UTFS_RESULT.RES_OK)

			assert.equal(fs.file_list[0]?.size_loaded, 3)
			assert.equal(fs.file_list[0]?.signature, 0)
			assert.deepEqual(fs.file_list[0].data, Uint8Array.from([ 42, 77, 0 ]))
		})

	})

	describe('save', () => {
		it('should ', () => {})
	})

	describe('save_flush', () => {
		it('should ', () => {})
	})

	describe('load_file', () => {
		it('should ', () => {})
	})

	describe('save_file', () => {
		it('should ', () => {})
	})

	describe('entires', () => {
		it('should ', () => {})
	})

})
