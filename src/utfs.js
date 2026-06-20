/** biome-ignore-all lint/suspicious/noBitwiseOperators: used to set flags */
/** biome-ignore-all lint/style/noExcessiveLinesPerFile: contains all the stuff */
/** biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: it is complex */
/** biome-ignore-all lint/complexity/noExcessiveLinesPerFunction: it does all the work */
/** biome-ignore-all lint/style/useShorthandAssign: better readability */
/** biome-ignore-all lint/performance/noAwaitInLoops: standard stuff */

import { Common, HEADER_LENGTH } from './common.js'
import {
	FLAGS_MASK,
	FLAGS_MASK_INVERSE,
	UTFS_FLAGS,
	UTFS_IDENTIFIER,
	UTFS_MAX_FILENAME,
	UTFS_MAX_FILES,
	UTFS_OPTIONS,
	UTFS_RESULT,
	UTFS_VERSION_V1
} from './defs.js'
import { range } from './range.js'

/** @import { Header, FileSystem, FSOptions, RegistrationFile, File, Flags, Options, Result } from './defs.js' */

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

/**
 * @param {FileSystem} fs
 * @param {...any} args
 */
export function log(fs, ...args) {
	if(!fs.verbose) { return }
	console.log(...args)
}

/**
 * @param {RegistrationFile} file
 * @returns {file is File}
 */
export function isFile(file) {
	if(file === undefined) { return false }

	return true
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
	 * @param {RegistrationFile} file
	 * @param {Flags|undefined} [flags]
	 * @param {Options|undefined} [options]
	 * @returns {Result}
	 */
	static register(fs, file, flags, options) {
		if(!UTFS.isValidFilename(fs, file.filename)) { throw new Error('invalid filename')}

		if(file.size === undefined && file.data !== undefined) {
			file.size = file.data.byteLength
		}

		file.signature ??= 0
		file.size_loaded ??= 0
		file.attr ??= 0
		file.size ??= 0

		if(!isFile(file)) { throw new Error('invalid file') }

		file.flags = flags ?? UTFS_FLAGS.UTFS_NO_FLAGS
		const effectiveOptions = options ?? UTFS_OPTIONS.UTFS_NO_OPT

		for(const index of range(0, UTFS_MAX_FILES)) {
			const existing = fs.file_list[index]

			if(existing === undefined) {
				log(fs, `Found empty slot ${index}`)
				fs.file_list[index] = file
				return UTFS_RESULT.RES_OK
			}

			if(fs.collator.compare(file.filename, existing.filename) === 0) {
				if((effectiveOptions & UTFS_OPTIONS.UTFS_OPT_REPLACE) === UTFS_OPTIONS.UTFS_OPT_REPLACE) {
					log(fs, `Found ${existing.filename}=${file.filename}, replacing`)
					fs.file_list[index] = file
					return UTFS_RESULT.RES_OK
				}

				log(fs, `Found ${file.filename}, NOT overwriting`)
				return UTFS_RESULT.RES_FILENAME_EXISTS
			}
		}

		log(fs, 'Could not find slot')
		return UTFS_RESULT.RES_FILESYSTEM_FULL
	}

	/**
	 * @param {FileSystem} fs
	 * @param {Pick<File, 'filename'>} file
	 * @returns {Result}
	 */
	static unregister(fs, file) {
		if(!UTFS.isValidFilename(fs, file.filename)) { throw new Error('invalid filename')}

		for(const index of range(0, UTFS_MAX_FILES)) {
			const existing = fs.file_list[index]
			if(existing === undefined) { continue }

			if(fs.collator.compare(file.filename, existing.filename) === 0) {
				log(fs, `Removed ${existing.filename} at position ${index}`)
				fs.file_list[index] = undefined
				return UTFS_RESULT.RES_OK
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
			const existingFile = fs.file_list.find(value =>
				value === undefined ?
					false :
					fs.collator.compare(value.filename, header.filename) === 0
			)

			if(existingFile === undefined) {
				log(fs, `Did not find file ${header.filename}`)
				continue
			}

			if(existingFile.data === undefined) {
				log(fs, 'Null data, skipping')

				existingFile.size_loaded = 0
				existingFile.signature = header.signature
				existingFile.flags = (existingFile.flags & FLAGS_MASK) | header.flags
				continue
			}

			if((existingFile.flags & UTFS_FLAGS.UTFS_LOAD_EXPLICIT) === UTFS_FLAGS.UTFS_LOAD_EXPLICIT) {
				log(fs, `LOAD_EXPLICIT set, skipping read '${header.filename}'`)
				existingFile.size_loaded = 0
				existingFile.signature = 0
				existingFile.flags = existingFile.flags & FLAGS_MASK
				continue
			}

			const dataSize = Math.min(existingFile.size, header.size)
			const data = await Common.readData(fs, dataOffset, dataSize, existingFile.data)
			existingFile.data = data
			existingFile.size_loaded = dataSize
			existingFile.signature = header.signature
			existingFile.flags = (existingFile.flags & FLAGS_MASK) | header.flags
		}

		if(!hasOne) {
			log(fs, 'Error loading FS')
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

			log(fs, `Writing file ${file.filename} at pos ${offset}`)

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
				log(fs, 'Error writing header, fs full')
				return UTFS_RESULT.RES_FILESYSTEM_FULL
			}

			offset += written
			const dataOffset = offset
			offset += file.size

			if((file.flags & UTFS_FLAGS.UTFS_SAVE_EXPLICIT) === UTFS_FLAGS.UTFS_SAVE_EXPLICIT) {
				log(fs, `SAVE_EXPLICIT set, not writing '${file.filename}'`)
				continue
			}

			const writtenData = await Common.writeData(fs, dataOffset, file.data, file.size)
			if(writtenData !== file.size) {
				log(fs, `Error saving ${writtenData}!=${file.size}`)
				// todo throw error or return partial save error here
			}
		}

		fs.structure_saved = true
		return UTFS_RESULT.RES_OK
	}

	/**
	 * @param {FileSystem} fs
	 * @param {Pick<File, 'filename'>} file
	 * @returns {Promise<Result>}
	 */
	static async load_file(fs, file) {
		if(!UTFS.isValidFilename(fs, file.filename)) { throw new Error('invalid filename')}

		let offset = fs.baseAddress

		for(const index of range(0, UTFS_MAX_FILES)) {
			const header = await Common.readHeader(fs, offset)
			if(header.identifier !== UTFS_IDENTIFIER) { break }
			if(header.version !== UTFS_VERSION_V1) { break }

			offset += HEADER_LENGTH
			const dataOffset = offset
			offset += header.size

			const existingFile = fs.file_list[index]
			if(existingFile === undefined) { continue }

			if(fs.collator.compare(existingFile.filename, file.filename) !== 0) {
				continue
			}

			log(fs, `Found file to load, pos ${offset}`)
			if(fs.verbose) { print_header(header) }

			if(existingFile.data === undefined) {
				log(fs, 'Null data, skipping')
				return UTFS_RESULT.RES_OK
			}

			const dataSize = Math.min(existingFile.size, header.size)
			const data = await Common.readData(fs, dataOffset, dataSize, existingFile.data)
			existingFile.data = data
			existingFile.size_loaded = dataSize
			existingFile.signature = header.signature
			existingFile.flags = (existingFile.flags & FLAGS_MASK) | header.flags

			return UTFS_RESULT.RES_OK
		}

		return UTFS_RESULT.RES_FILE_NOT_FOUND
	}

	/**
	 * @param {FileSystem} fs
	 * @param {Pick<File, 'filename'>} file
	 * @returns {Promise<Result>}
	 */
	static async save_file(fs, file) {
		if(!UTFS.isValidFilename(fs, file.filename)) { throw new Error('invalid filename')}

		if(fs.structure_saved === false) {
			// todo - original code auto-saves entire structure
			return UTFS_RESULT.RES_PARAM_ERROR
		}

		let offset = fs.baseAddress

		for(const index of range(0, UTFS_MAX_FILES)) {
			const existingFile = fs.file_list[index]
			if(existingFile === undefined) { continue }

			if(fs.collator.compare(existingFile.filename, file.filename) !== 0) {
				offset += HEADER_LENGTH + existingFile.size
				continue
			}

			log(fs, `Writing file ${file.filename}, id ${index} at pos ${offset}`)

			const written = await Common.writeHeader(fs, offset, {
				identifier: UTFS_IDENTIFIER,
				version: UTFS_VERSION_V1,

				flags: existingFile.flags & FLAGS_MASK_INVERSE,
				signature: existingFile.signature,
				size: existingFile.size,
				filename: existingFile.filename,

				reserved: 0
			})

			if(written !== HEADER_LENGTH) {
				log(fs, 'Error writing header')
				throw new Error('failed writing header')
			}

			offset += HEADER_LENGTH

			const writtenData = await Common.writeData(fs, offset, existingFile.data, existingFile.size)
			if(writtenData !== existingFile.size) {
				log(fs, 'Error writing data')
				throw new Error('failed writing data')
			}

			return UTFS_RESULT.RES_OK
		}

		return UTFS_RESULT.RES_FILE_NOT_FOUND
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
