/** biome-ignore-all lint/suspicious/noBitwiseOperators: used to set flags */
/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: it is complex */
/** biome-ignore-all lint/complexity/noExcessiveLinesPerFunction: it does all the work */
/** biome-ignore-all lint/style/useShorthandAssign: better readability */
/** biome-ignore-all lint/performance/noAwaitInLoops: standard stuff */

import { Common, HEADER_LENGTH } from './common.js'
import { FLAGS_MASK, FLAGS_MASK_INVERSE, UTFS_FLAGS, UTFS_IDENTIFIER, UTFS_MAX_FILENAME, UTFS_MAX_FILES, UTFS_OPTIONS, UTFS_RESULT, UTFS_VERSION_V1 } from './defs.js'

/** @import { Header, FileSystem, FSOptions, File, Flags, Options, Result } from './defs.js' */

/**
 * @param {number} start
 * @param {number} end
 * @param {number} [step=1]
 */
export function* range(start, end, step = 1) {
	for(let i = start; i <= end; i += step) {
		yield i
	}
}
/**
 * @param {Header} header
 */
export function print_header(header)
{
	console.log('Header:')
	console.log(` identifier: ${header.identifier}`)
	console.log(` version: ${header.version}`)
	console.log(` flags: ${header.flags}`)
	console.log(` signature: ${header.signature}`)
	console.log(` reserved: ${header.reserved}`)
	console.log(` size: ${header.size}`)
	console.log(` filename: '${header.filename}'`)
}

export class UTFS {
	/**
	 * @param {FSOptions|undefined} options
	 * @returns {FileSystem}
	 */
	static init(options) {
		const { readFn, writeFn } = options ?? {}
		if(readFn === undefined) { throw new Error('readFn undefined') }
		if(writeFn === undefined) { throw new Error('writeFn undefined') }

		return {
			file_list: [],
			structure_saved: false,

			verbose: options?.verbose ?? false,
			baseAddress: options?.baseAddress ?? 0,

			readFn,
			writeFn,

			collator: options?.collator ?? new Intl.Collator('en'),
			encoder: options?.encoder ?? new TextEncoder(),
			decoder: options?.decoder ?? new TextDecoder('utf-8', { fatal: true, ignoreBOM: false })
		}
	}

	/**
	 * @param {FileSystem} fs
	 * @param {File} file
	 * @param {Flags} flags
	 * @param {Options} options
	 * @returns {Result}
	 */
	static register(fs, file, flags, options) {
		if(!UTFS.isValidFilename(fs, file.filename)) { throw new Error('invalid filename')}

		file.flags = flags

		for(const index of range(0, UTFS_MAX_FILES)) {
			const existing = fs.file_list[index]

			if(existing === undefined) {
				if(fs.verbose) { console.log(`Found empty slot ${index}`) }
				fs.file_list[index] = file
				return UTFS_RESULT.RES_OK
			}

			if(fs.collator.compare(file.filename, existing.filename) === 0) {
				if((options & UTFS_OPTIONS.UTFS_OPT_REPLACE) === UTFS_OPTIONS.UTFS_OPT_REPLACE) {
					if(fs.verbose) { console.log(`Found ${existing.filename}=${file.filename}, replacing`) }
					fs.file_list[index] = file
					return UTFS_RESULT.RES_OK
				}

				if(fs.verbose) { console.log(`Found ${file.filename}, NOT overwriting`) }
				return UTFS_RESULT.RES_FILENAME_EXISTS
			}
		}

		if(fs.verbose) { console.log('Could not find slot') }
		return UTFS_RESULT.RES_FILESYSTEM_FULL
	}

	/**
	 * @param {FileSystem} fs
	 * @param {File} file
	 * @returns {Result}
	 */
	static unregister(fs, file) {
		if(!UTFS.isValidFilename(fs, file.filename)) { throw new Error('invalid filename')}

		for(const index of range(0, UTFS_MAX_FILES)) {
			const existing = fs.file_list[index]
			if(existing === undefined) { continue }

			if(fs.collator.compare(file.filename, existing.filename) === 0) {
				if(fs.verbose) { console.log(`Removed ${existing.filename} at position ${index}`) }
				fs.file_list[index] = undefined
			}
		}

		return UTFS_RESULT.RES_FILE_NOT_FOUND
	}

	/**
	 * @param {FileSystem} fs
	 * @returns {Promise<Result>}
	 */
	static async load(fs) {

		let offset = fs.baseAddress
		let hasOne = false

		for(const _index of range(0, UTFS_MAX_FILES)) {
			const header = await Common.readHeader(fs, offset)
			if(header.identifier !== UTFS_IDENTIFIER) { break }
			if(header.version !== UTFS_VERSION_V1) { break }

			hasOne = true

			if(fs.verbose) { print_header(header) }

			offset += HEADER_LENGTH
			const dataOffset = offset
			offset += header.size

			//
			const existingIndex = fs.file_list.findIndex(value =>
				value === undefined ?
					false :
					fs.collator.compare(value.filename, header.filename) === 0)

			if(existingIndex === -1) {
				if(fs.verbose) { console.log(`Did not find file ${header.filename}`)}
				continue
			}

			const existingFile = fs.file_list[existingIndex]

			if(existingFile === undefined) { continue }

			if(existingFile.data === undefined) {
				if(fs.verbose) { console.log('Null data, skipping') }

				existingFile.size_loaded = 0
				existingFile.signature = header.signature
				existingFile.flags = (existingFile.flags & FLAGS_MASK) | header.flags
				continue
			}

			if((existingFile.flags & UTFS_FLAGS.UTFS_LOAD_EXPLICIT) === UTFS_FLAGS.UTFS_LOAD_EXPLICIT) {
				if(fs.verbose) { console.log(`LOAD_EXPLICIT set, skipping read '${header.filename}'`) }
				existingFile.size_loaded = 0
				existingFile.signature = 0
				existingFile.flags = existingFile.flags & FLAGS_MASK
				continue
			}

			const dataSize = Math.min(existingFile.size, header.size)
			const data = await Common.readData(fs, dataOffset, dataSize)
			existingFile.data = data // todo copyInto
			existingFile.size_loaded = dataSize
			existingFile.signature = header.signature
			existingFile.flags = (existingFile.flags & FLAGS_MASK) | header.flags
		}

		if(!hasOne) {
			if(fs.verbose) { console.log('Error loading FS') }
			return UTFS_RESULT.RES_INVALID_FS
		}


		return UTFS_RESULT.RES_OK
	}

	/**
	 * @param {FileSystem} fs
	 * @returns {Promise<Result>}
	 */
	static async save(fs) {

		let offset = fs.baseAddress

		for(const index of range(0, UTFS_MAX_FILES)) {
			const file = fs.file_list[index]
			if(file === undefined) { continue }

			if(fs.verbose) { console.log(`Writing file ${file.filename} at pos ${offset}`)}

			const written = await Common.writeHeader(fs, offset, {
				identifier: UTFS_IDENTIFIER,
				version: UTFS_VERSION_V1,

				flags: file.flags & FLAGS_MASK_INVERSE,
				signature: file.signature,
				size: file.size,
				filename: file.filename,

				reserved: 0
			})

			if(written !== HEADER_LENGTH) {
				if(fs.verbose) { console.log('Error writing header, fs ful') }
				return UTFS_RESULT.RES_FILESYSTEM_FULL
			}

			offset += written
			const dataOffset = offset
			offset += file.size

			if((file.flags & UTFS_FLAGS.UTFS_SAVE_EXPLICIT) === UTFS_FLAGS.UTFS_SAVE_EXPLICIT) {
				if(fs.verbose) { console.log(`SAVE_EXPLICIT set, not writing '${file.filename}'`) }
				continue
			}

			const writtenData = await Common.writeData(fs, dataOffset, file.data, file.size)
			if(writtenData !== file.size) {
				// biome-ignore lint/style/useCollapsedIf: just logging
				if(fs.verbose) { console.log(`Error saving ${writtenData}!=${file.size}`) }
			}
		}

		fs.structure_saved = true
		return UTFS_RESULT.RES_OK
	}

	/**
	 * @param {FileSystem} fs
	 * @param {File} file
	 * @returns {Result}
	 */
	static load_file(fs, file) {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @param {FileSystem} fs
	 * @param {File} file
	 * @returns {Result}
	 */
	static save_file(fs, file) {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @param {FileSystem} fs
	 * @returns {Generator<{ index: number } & Pick<File, 'filename'|'signature'|'flags'>>}
	 */
	static *entries(fs) {
		for(const index of range(0, UTFS_MAX_FILES)) {
			const file = fs.file_list[index]
			if(file === undefined) { continue }

			const {
				filename,
				signature,
				flags
			} = file

			yield {
				index, filename, signature, flags
			}
		}
	}

	/**
	 * @param {FileSystem} fs
	 * @param {string} name
	 */
	static isValidFilename(fs, name) {
		if(name === undefined) { return false }
		if(typeof name !== 'string') { return false }

		const encodedName = fs.encoder.encode(name)
		if(encodedName.byteLength <= 0) { return false }
		if(encodedName.byteLength > UTFS_MAX_FILENAME) { return false }

		return true
	}
}
