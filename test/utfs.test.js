import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
	UTFS,
	UTFS_FLAGS,
	UTFS_MAX_FILES,
	UTFS_OPTIONS,
	UTFS_RESULT
} from '@johntalton/utfs'

import { range } from '../src/range.js'

describe('UTFS', () => {
	describe('init', () => {
		it('should throw on empty', () => {
			assert.throws(() => {
				const fs = UTFS.init(undefined)
			}, {
				name: 'Error',
				message: 'readFn undefined'
			})
		})

		it('should throw on missing readFn', () => {
			assert.throws(() => {
				const fs = UTFS.init({
					readFn: undefined,
					writeFn: () => 0
				})
			}, {
				name: 'Error',
				message: 'readFn undefined'
			})
		})

		it('should throw on missing writeFn', () => {
			assert.throws(() => {
				const fs = UTFS.init({
					readFn: async () => Uint8Array.from([]),
					writeFn: undefined
				})
			}, {
				name: 'Error',
				message: 'writeFn undefined'
			})
		})

		it('should return default fs', () => {
			const fs = UTFS.init({
				readFn:  async () => Uint8Array.from([]),
				writeFn: async () => 0
			})

			assert.equal(fs.baseAddress, 0)
			assert.deepEqual(fs.file_list, [])
		})
	})

	describe('register', () => {
		it('should register single file', () => {
			const fs = UTFS.init({
				readFn:  async () => Uint8Array.from([]),
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
			assert.equal(result, UTFS_RESULT.RES_OK)

			assert.equal(fs.structure_saved, false)
			assert.equal(fs.file_list.length, 1)
			assert.equal(fs.file_list[0], file)
		})

		it('should throw on invalid file name', () => {
			const fs = UTFS.init({
				readFn:  async () => Uint8Array.from([]),
				writeFn: async () => 0
			})

			const file = {
				filename: '👩🏻‍❤️‍💋‍👩🏼', // as encoded more then 11 chars
				signature: 0,
				size: 0,
				size_loaded: 0,
				data: undefined,
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}

			assert.throws(() => {
				UTFS.register(fs, file, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			}, {
				name: 'Error',
				message: 'invalid filename'
			})
		})

		it('should not overwrite existing file (no replace)', () => {
			const fs = UTFS.init({
				readFn:  async () => Uint8Array.from([]),
				writeFn: async () => 0
			})

			const file = {
				filename: 'test',
				signature: 0,
				size: 0,
				size_loaded: 0,
				data: new Uint8Array(0),
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}

			const result = UTFS.register(fs, file, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(result, UTFS_RESULT.RES_OK)

			const file2 = {
				filename: 'test',
				signature: 0,
				size: 0,
				size_loaded: 0,
				data: new Uint8Array(0),
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}

			const result2 = UTFS.register(fs, file2, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(result2, UTFS_RESULT.RES_FILENAME_EXISTS)
		})

		it('should overwrite existing file (replace)', () => {
			const fs = UTFS.init({
				readFn:  async () => Uint8Array.from([]),
				writeFn: async () => 0
			})

			const file = {
				filename: 'test',
				signature: 0,
				size: 0,
				size_loaded: 0,
				data: new Uint8Array(0),
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}

			const result = UTFS.register(fs, file, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(result, UTFS_RESULT.RES_OK)

			const file2 = {
				filename: 'test',
				signature: 0,
				size: 0,
				size_loaded: 0,
				data: new Uint8Array(0),
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}

			const result2 = UTFS.register(fs, file2, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_OPT_REPLACE)
			assert.equal(result2, UTFS_RESULT.RES_OK)

		})

		it('should return fs full on more then UTFS_MAX_FILES files', () => {

			const fs = UTFS.init({
				readFn:  async () => Uint8Array.from([]),
				writeFn: async () => 0
			})

			for(const index of range(0, UTFS_MAX_FILES)) {
				const file = {
					filename: `test-${index}`,
					signature: 0,
					size: 0,
					size_loaded: 0,
					data: new Uint8Array(0),
					attr: 0,
					flags: UTFS_FLAGS.UTFS_NO_FLAGS
				}

				const result = UTFS.register(fs, file, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
				assert.equal(result, UTFS_RESULT.RES_OK)
			}

			assert.equal(fs.file_list.length, 5)

			const file = {
					filename: `overflow`,
					signature: 0,
					size: 0,
					size_loaded: 0,
					data: new Uint8Array(0),
					attr: 0,
					flags: UTFS_FLAGS.UTFS_NO_FLAGS
				}

				const result = UTFS.register(fs, file, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
				assert.equal(result, UTFS_RESULT.RES_FILESYSTEM_FULL)
		})
	})

	describe('unregister', () => {
		it('should unregister empty', () => {
			const fs = UTFS.init({
				readFn:  async () => Uint8Array.from([]),
				writeFn: async () => 0
			})

			const file = {
				filename: 'test'
			}

			const result = UTFS.unregister(fs, file)
			assert.equal(result, UTFS_RESULT.RES_FILE_NOT_FOUND)
		})

		it('should register and unregister for empty list', () => {
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


			const fileToUnregister = {
				filename: 'test'
			}
			const unregisterResult = UTFS.unregister(fs, fileToUnregister)
			assert.equal(unregisterResult, UTFS_RESULT.RES_OK)
		})

		it('should register three and unregister second (make a gap)', () => {
			const fs = UTFS.init({
				readFn:  async () => Uint8Array.from([]),
				writeFn: async () => 0
			})

			const file = {
				filename: 'test-1',
				signature: 0,
				size: 0,
				size_loaded: 0,
				data: new Uint8Array(0),
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}

			const result = UTFS.register(fs, file, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(result, UTFS_RESULT.RES_OK)

			const file2 = {
				filename: 'test-2',
				signature: 0,
				size: 0,
				size_loaded: 0,
				data: new Uint8Array(0),
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}

			const result2 = UTFS.register(fs, file2, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_OPT_REPLACE)
			assert.equal(result2, UTFS_RESULT.RES_OK)

			const file3 = {
				filename: 'test-3',
				signature: 0,
				size: 0,
				size_loaded: 0,
				data: new Uint8Array(0),
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}

			const result3 = UTFS.register(fs, file3, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_OPT_REPLACE)
			assert.equal(result3, UTFS_RESULT.RES_OK)


			const unregisterFile = {
				filename: 'test-2'
			}
			const unregisterResult = UTFS.unregister(fs, unregisterFile)
			assert.equal(unregisterResult, UTFS_RESULT.RES_OK)


			assert.equal(fs.file_list.length, 3)
			assert.equal(fs.file_list[1], undefined)

			assert.deepEqual(Array.from(UTFS.entries(fs)), [
				{ filename: 'test-1', flags: 0, index: 0, signature: 0 },
				{ filename: 'test-3', flags: 0, index: 2, signature: 0 }
			])

		})
	})

	describe('load', () => {
		it('should reject from empty buffer', async () => {
			const fs = UTFS.init({
				readFn:  async () => new Uint8Array(0),
				writeFn: async () => 0
			})

			assert.rejects(async () => {
				const status = await UTFS.load(fs)
			}, {
				name: 'RangeError',
				message: 'read size not adequate for header'
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

		it('should load with and match file (sys read returns arrayBuffer)', async () => {
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
					if(offset === 0) return buffer.buffer
					if(offset === 24) return Uint8Array.from([ 42, 77, 0 ]).buffer
					return new Uint8Array(24).buffer
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
		it('should save empty', async () => {
			const fs = UTFS.init({
				readFn:  async () => new Uint8Array(0),
				writeFn: async () => 0
			})


			const status = await UTFS.save(fs)
			assert.equal(status, UTFS_RESULT.RES_OK)
		})

		it('should save single file', async () => {
			const target8 = new Uint8Array(24 + 3)

			const fs = UTFS.init({
				// verbose: true,
				readFn:  async () => new Uint8Array(0),
				writeFn: async (address, data, length) => {

					const source = ArrayBuffer.isView(data) ?
						new Uint8Array(data.buffer, data.byteOffset, length) :
						new Uint8Array(data, 0, length)

					const offset =  address

					target8.set(source, offset)

					return length
				}
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
			const registerStatus = UTFS.register(fs, file, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(registerStatus, UTFS_RESULT.RES_OK)

			const status = await UTFS.save(fs)
			assert.equal(status, UTFS_RESULT.RES_OK)

			assert.equal(target8[0], 0x19)
			assert.equal(target8[24], 42)
			assert.equal(target8[25], 77)
		})
	})

	describe('load_file', () => {
		it('should reject from empty buffer', async () => {
			const fs = UTFS.init({
				readFn:  async () => new Uint8Array(0),
				writeFn: async () => 0
			})

			const file = {
				filename: 'test'
			}

			assert.rejects(async () => {
				const status = await UTFS.load_file(fs, file)
			}, {
				name: 'RangeError',
				message: 'read size not adequate for header',
			})
		})

		it('should load from multiple (3) saved files', async () => {
			const buffer = new Uint8Array((24 + 3) + (24 + 5) + (24 + 7))

			const fs = UTFS.init({
				readFn:  async (offset, length) => {
					return buffer.slice(offset, offset + length)
				},
				writeFn: async (offset, data, length) => {
					const data8 = ArrayBuffer.isView(data) ?
						new Uint8Array(data.buffer, data.byteOffset, length) :
						new Uint8Array(data, 0, length)

					buffer.set(data8, offset)
					return length
				}
			})

			const file1 = {
				filename: 'test-1',
				size: 3,
				data: Uint8Array.from([ 1,2,3 ]),
				attr: 0,
				signature: 0,
				size_loaded: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const status1 = UTFS.register(fs, file1, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(status1, UTFS_RESULT.RES_OK)


			const file2 = {
				filename: 'test-2',
				size: 5,
				data: Uint8Array.from([ 5,5,5,5,5 ]),
				attr: 0,
				signature: 0,
				size_loaded: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const status2 = UTFS.register(fs, file2, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(status2, UTFS_RESULT.RES_OK)


			const file3 = {
				filename: 'test-3',
				size: 7,
				data: Uint8Array.from([ 77, 7, 77, 7, 77, 7, 77 ]),
				attr: 0,
				signature: 0,
				size_loaded: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const status3 = UTFS.register(fs, file3, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(status3, UTFS_RESULT.RES_OK)

			const saveStatus = await UTFS.save(fs)
			assert.equal(saveStatus, UTFS_RESULT.RES_OK)


			const file = {
				filename: 'test-2'
			}

			const status = await UTFS.load_file(fs, file)
			assert.equal(status, UTFS_RESULT.RES_OK)

		})

		it('should load from multiple (3 with 1 removed item) saved files', { skip: 'known to return not found' }, async () => {
			const buffer = new Uint8Array((24 + 3) + (24 + 5) + (24 + 7))

			const fs = UTFS.init({
				// verbose: true,
				readFn:  async (offset, length) => {
					return buffer.slice(offset, offset + length)
				},
				writeFn: async (offset, data, length) => {
					const data8 = ArrayBuffer.isView(data) ?
						new Uint8Array(data.buffer, data.byteOffset, length) :
						new Uint8Array(data, 0, length)

					buffer.set(data8, offset)
					return length
				}
			})

			const file1 = {
				filename: 'test-1',
				size: 3,
				data: Uint8Array.from([ 1,2,3 ]),
				attr: 0,
				signature: 0,
				size_loaded: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const status1 = UTFS.register(fs, file1, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(status1, UTFS_RESULT.RES_OK)


			const file2 = {
				filename: 'test-2',
				size: 5,
				data: Uint8Array.from([ 5,5,5,5,5 ]),
				attr: 0,
				signature: 0,
				size_loaded: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const status2 = UTFS.register(fs, file2, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(status2, UTFS_RESULT.RES_OK)


			const file3 = {
				filename: 'test-3',
				size: 7,
				data: Uint8Array.from([ 77, 7, 77, 7, 77, 7, 77 ]),
				attr: 0,
				signature: 0,
				size_loaded: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const status3 = UTFS.register(fs, file3, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(status3, UTFS_RESULT.RES_OK)


			const unregisterStatus = UTFS.unregister(fs, { filename: 'test-2' })


			const saveStatus = await UTFS.save(fs)
			assert.equal(saveStatus, UTFS_RESULT.RES_OK)


			const file = {
				filename: 'test-3'
			}

			const status = await UTFS.load_file(fs, file)
			assert.equal(status, UTFS_RESULT.RES_OK)

		})

		it('should load from databuffer (truncated data)', async () => {
			const buffer = Uint8Array.from([
				0x19, 0x84, 0x01, 0x00, 0x00, 0x00,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x03,
				0x74, 0x65, 0x73, 0x74, 0x2d, 0x31,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
				  42,   77,    0,
				0x19, 0x84, 0x01, 0x00, 0x00, 0x01,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x04,
				0x74, 0x65, 0x73, 0x74, 0x2d, 0x32,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
				   4,    2,    4,    2
			])

			const fs = UTFS.init({
				// verbose: true,
				readFn:  async (offset, length) => {
					return buffer.slice(offset, offset + length)
				},
				writeFn: async (offset, data, length) => 0
			})

			const file1 = {
				filename: 'test-1',
				size: 3,
				data: Uint8Array.from([ 0, 0, 0 ]),
				attr: 0,
				signature: 0,
				size_loaded: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const status1 = UTFS.register(fs, file1, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(status1, UTFS_RESULT.RES_OK)


			const file2 = {
				filename: 'test-2',
				size: 2,
				data: Uint8Array.from([ 0, 0 ]),
				attr: 0,
				signature: 0,
				size_loaded: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const status2 = UTFS.register(fs, file2, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(status2, UTFS_RESULT.RES_OK)


			const loadStatus = await UTFS.load_file(fs, { filename: 'test-2' })
			assert.equal(loadStatus, UTFS_RESULT.RES_OK)

			assert.equal(fs.file_list[1]?.filename, 'test-2')
			assert.equal(fs.file_list[1]?.size_loaded, 2)
			assert.equal(fs.file_list[1]?.size, 2)
			assert.deepEqual(fs.file_list[1].data, Uint8Array.from([ 4, 2 ]))
		})
	})

	describe('save_file', () => {
		it('should save single file', async () => {
			const buffer = new Uint8Array(24 + 3)

			const fs = UTFS.init({
				readFn:  async () => new Uint8Array(0),
				writeFn: async (offset, data, length) => {
					const data8 = ArrayBuffer.isView(data) ?
						new Uint8Array(data.buffer, data.byteOffset, length) :
						new Uint8Array(data, 0, length)

					buffer.set(data8, offset)
					return length
				}
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
			const registerStatus = UTFS.register(fs, file, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(registerStatus, UTFS_RESULT.RES_OK)

			const saveStatus = await UTFS.save(fs)
			assert.equal(saveStatus, UTFS_RESULT.RES_OK)

			const status = await UTFS.save_file(fs, { filename: 'test' })
			assert.equal(status, UTFS_RESULT.RES_OK)

			assert.deepEqual(buffer, Uint8Array.from([
				0x19, 0x84, 0x01, 0x00, 0x00, 0x00,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x03,
				0x74, 0x65, 0x73, 0x74, 0x00, 0x00,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
				42, 77, 0
			]))
		})


		it('should save single file when multiple are registered', async () => {
			const buffer = new Uint8Array((24 + 3) + (24 + 4))

			const fs = UTFS.init({
				readFn:  async () => new Uint8Array(0),
				writeFn: async (offset, data, length) => {
					const data8 = ArrayBuffer.isView(data) ?
						new Uint8Array(data.buffer, data.byteOffset, length) :
						new Uint8Array(data, 0, length)

					buffer.set(data8, offset)
					return length
				}
			})

			const file1 = {
				filename: 'test-1',
				signature: 0,
				size: 3,
				size_loaded: 0,
				data: Uint8Array.from([ 42, 77, 0 ]),
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const registerStatus1 = UTFS.register(fs, file1, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(registerStatus1, UTFS_RESULT.RES_OK)

			const file2 = {
				filename: 'test-2',
				signature: 0,
				size: 2,
				size_loaded: 0,
				data: Uint8Array.from([ 1, 2 ]),
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const registerStatus2 = UTFS.register(fs, file2, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(registerStatus2, UTFS_RESULT.RES_OK)

			const saveStatus = await UTFS.save(fs)
			assert.equal(saveStatus, UTFS_RESULT.RES_OK)

			const updatedFile2 = {
				filename: 'test-2',
				signature: 1,
				size: 4,
				size_loaded: 0,
				data: Uint8Array.from([ 4, 2, 4, 2 ]),
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const reregisterStatus = UTFS.register(fs, updatedFile2, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_OPT_REPLACE)

			const status = await UTFS.save_file(fs, { filename: 'test-2' })
			assert.equal(status, UTFS_RESULT.RES_OK)

			assert.deepEqual(buffer, Uint8Array.from([
				0x19, 0x84, 0x01, 0x00, 0x00, 0x00,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x03,
				0x74, 0x65, 0x73, 0x74, 0x2d, 0x31,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
				  42,   77,    0,
				0x19, 0x84, 0x01, 0x00, 0x00, 0x01,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x04,
				0x74, 0x65, 0x73, 0x74, 0x2d, 0x32,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
				   4,    2,    4,    2
			]))
		})

	})

	describe('entires', () => {
		it('should list empty', () => {
			const fs = UTFS.init({
				readFn:  async () => new Uint8Array(0),
				writeFn: async () => 0
			})

			const result = Array.from(UTFS.entries(fs))
			assert.deepEqual(result, [])
		})

		it('should list two files', () => {
			const fs = UTFS.init({
				readFn:  async () => new Uint8Array(0),
				writeFn: async () => 0
			})


			const file = {
				filename: 'test-1',
				signature: 0,
				size: 3,
				size_loaded: 0,
				data: Uint8Array.from([ 42, 77, 0 ]),
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const registerResult = UTFS.register(fs, file, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(registerResult, UTFS_RESULT.RES_OK)

			const file2 = {
				filename: 'test-2',
				signature: 0,
				size: 3,
				size_loaded: 0,
				data: Uint8Array.from([ 42, 77, 0 ]),
				attr: 0,
				flags: UTFS_FLAGS.UTFS_NO_FLAGS
			}
			const registerResult2 = UTFS.register(fs, file2, UTFS_FLAGS.UTFS_NO_FLAGS, UTFS_OPTIONS.UTFS_NO_OPT)
			assert.equal(registerResult2, UTFS_RESULT.RES_OK)


			const result = Array.from(UTFS.entries(fs))
			assert.deepEqual(result, [
				{ filename: 'test-1', flags: 0, index: 0, signature: 0  },
				{ filename: 'test-2', flags: 0, index: 1, signature: 0  }
			])
		})
	})

})
