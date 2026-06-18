
/** biome-ignore-all lint/style/useNumericSeparators: <explanation> */
/** biome-ignore-all lint/suspicious/noBitwiseOperators: <explanation> */

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

/** @typedef {number & { __brand: 'result' }} Result */

/** @typedef {ArrayBufferView | ArrayBufferLike} Data */

/** @typedef {number} Flags */
/** @typedef {number} Options */

/** @typedef {(address: number, length: number) => Data} SysRead */
/** @typedef {(address: number, data: Data, length: number) => number} SysWrite */
/**
 * @typedef {Object} FileSystem
 * @property {Array<File|undefined>} file_list
 * @property {boolean} structure_saved
 * @property {boolean} verbose
 * @property {number} baseAddress
 *
 * @property {Intl.Collator} collator
 * @property {TextEncoder} encoder
 * @property {TextDecoder} decoder
 */

/**
 * @typedef {Object} File
 * @property {string} filename
 * @property {number} signature
 * @property {number} flags
 * @property {number} size
 * @property {number} size_loaded
 * @property {number} attr
 * @property {Data} data
 */

/**
 * @typedef {Object} Header
 * @property {number} identifier
 * @property {number} version
 * @property {number} flags
 * @property {number} signature
 * @property {number} reserved
 * @property {number} size
 * @property {string} filename
 */

export const UTFS_MAX_FILES = 5
export const UTFS_MAX_FILENAME = 11

export const UTFS_IDENTIFIER = 0x1984
export const UTFS_VERSION_V1 = 1

export const UTFS_RESULT = {
	RES_OK:              result_from_number(0),
	RES_FILE_NOT_FOUND:  result_from_number(1),
	RES_READ_ERROR:      result_from_number(2),
	RES_WRITE_ERROR:     result_from_number(3),
	RES_PARAM_ERROR:     result_from_number(4),
	RES_FILENAME_EXISTS: result_from_number(5),
	RES_FILESYSTEM_FULL: result_from_number(6),
	RES_INVALID_FS:      result_from_number(7)
}

export const UTFS_FLAGS = {
		UTFS_NO_FLAGS:      0x0000,
    UTFS_EXT_ATTR:      0x0001,
    UTFS_LOAD_EXPLICIT: 0x0100,
    UTFS_SAVE_EXPLICIT: 0x0200,
}

export const UTFS_OPTIONS = {
	TFS_NO_OPT:       0x00,
	UTFS_OPT_REPLACE: 0x01,
}

/**
 * @param {Result} result
 * @returns {string}
 */
export function result_str(result) {
	switch(result){
		case UTFS_RESULT.RES_OK: return 'RES_OK'
		case UTFS_RESULT.RES_FILE_NOT_FOUND: return 'RES_FILE_NOT_FOUND'
		case UTFS_RESULT.RES_READ_ERROR: return 'RES_READ_ERROR'
		case UTFS_RESULT.RES_WRITE_ERROR: return 'RES_WRITE_ERROR'
		case UTFS_RESULT.RES_PARAM_ERROR: return 'RES_PARAM_ERROR'
		case UTFS_RESULT.RES_FILENAME_EXISTS: return 'RES_FILENAME_EXISTS'
		case UTFS_RESULT.RES_FILESYSTEM_FULL: return 'RES_FILESYSTEM_FULL'
		case UTFS_RESULT.RES_INVALID_FS: return 'RES_INVALID_FS'
		default:
			return 'RES_UNKNOWN'
	}
}

/**
 * @param {number} num
 * @returns {num is Result}
 */
export function is_result(num) {
	return (Number.isFinite(num) && num >= 0)
}

/**
 * @param {number} num
 * @returns {Result}
 */
export function result_from_number(num) {
	if(!is_result(num)) { throw new Error('invalid result number') }
	return num
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

/**
 * @param {FileSystem} fs
 * @param {...any} args
 */
export function log(fs, ...args) {
	if(!fs.verbose) { return }
	console.log(args)
}

export class UTFS {
	/**
	 * @param {FileSystem} fs
	 * @param {boolean} verbose
	 * @returns {Result}
	 */
	static init(fs, verbose) {
		fs.file_list = []
		fs.structure_saved = false
		fs.verbose = verbose
		fs.baseAddress = 0

		fs.collator = new Intl.Collator('en')
		fs.encoder = new TextEncoder()
		fs.decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false })

		log(fs, `utfs_verbose: ${verbose}`)
    // log(fs, `utfs_file_t size: ${FILE_HANDLE_SIZE} bytes`)

		return UTFS_RESULT.RES_OK
	}

	/**
	 * @param {FileSystem} fs
	 * @param {number} baseAddress
	 * @returns {Result}
	 */
	static baseaddress_set(fs, baseAddress) {
		fs.baseAddress = baseAddress
		return UTFS_RESULT.RES_OK
	}

	/**
	 * @param {FileSystem} fs
	 * @param {File} file
	 * @param {Flags} flags
	 * @param {Options} options
	 * @returns {Result}
	 */
	static register(fs, file, flags, options) {

		const filename = file.filename.slice(0, UTFS_MAX_FILENAME)

		file.flags = flags

		for(const index of range(0, UTFS_MAX_FILES)) {
			const existing = fs.file_list[index]

			if(existing === undefined) {
				log(fs, `Found empty slot ${index}`)
				fs.file_list[index] = file
				return UTFS_RESULT.RES_OK
			}

			if(fs.collator.compare(filename, existing.filename)) {
				if((options & UTFS_OPTIONS.UTFS_OPT_REPLACE) === UTFS_OPTIONS.UTFS_OPT_REPLACE) {
					log(fs, `Found ${existing.filename}=${filename}, replacing`)
					fs.file_list[index] = file
					return UTFS_RESULT.RES_OK
				}

				log(fs, `Found ${filename}, NOT overwriting`)
				return UTFS_RESULT.RES_FILENAME_EXISTS
			}
		}

		log(fs, 'Could not find slot')
		return UTFS_RESULT.RES_FILESYSTEM_FULL
	}

	/**
	 * @param {FileSystem} fs
	 * @param {File} file
	 * @returns {Result}
	 */
	static unregister(fs, file) {
		const filename = file.filename.slice(0, UTFS_MAX_FILENAME)

		for(const index of range(0, UTFS_MAX_FILES)) {
			const existing = fs.file_list[index]
			if(existing === undefined) { continue }

			if(fs.collator.compare(filename, existing.filename)) {
				log(fs, `Removed ${existing.filename} at position ${index}`)
				fs.file_list[index] = undefined
			}
		}

		return UTFS_RESULT.RES_FILE_NOT_FOUND
	}

	/**
	 * @param {FileSystem} fs
	 * @returns {Result}
	 */
	static async load(fs) {

		let offset = fs.baseAddress

		for(const index of range(0, UTFS_MAX_FILES)) {

			const header = await Common.readHeader(offset)
			if(fs.verbose) { print_header(header) }


			offset += HEADER_LENGTH
		}



	}

	/**
	 * @param {FileSystem} fs
	 * @returns {Result}
	 */
	static async save(fs) {
		return UTFS_RESULT.RES_INVALID_FS
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
	 * @param {File} file
	 * @param {string} name
	 * @param {Data} data
	 * @param {number} size
	 * @returns {Result}
	 */
	static set(file, name, data, size) {
		UTFS.set_filename(file, name)
		UTFS.set_data(file, data, size)
		return UTFS_RESULT.RES_OK
	}

	/**
	 * @param {File} file
	 * @param {string} name
	 * @returns {Result}
	 */
	static set_filename(file, name) {
		file.filename = name.slice(0, UTFS_MAX_FILENAME)
		return UTFS_RESULT.RES_OK
	}

	/**
	 * @param {File} file
	 * @param {Data} data
	 * @param {number} size
	 * @returns {Result}
	 */
	static set_data(file, data, size) {
		file.data = data
		file.size = size
		return UTFS_RESULT.RES_OK
	}

	/**
	 * @param {File} file
	 * @returns {number}
	 */
	static file_signature(file) {
		return file.signature
	}

	/**
	 * @param {File} file
	 * @param {number} signature
	 * @returns {Result}
	 */
	static file_signature_set(file, signature) {
		file.signature = signature
		return UTFS_RESULT.RES_OK
	}

	/**
	 * @param {FileSystem} fs
	 * @returns {Result}
	 */
	static status(fs) {
		let has = false
		for(const index of range(0, UTFS_MAX_FILES)) {
			const file = fs.file_list[index]
			if(file === undefined) { continue }

			has = true
			const { filename, size } = file
			console.log(`Entry ${index}: '${filename}' - ${size} `)
		}

		if(!has) { console.log('No UTFS entries found') }

		return UTFS_RESULT.RES_OK
	}
}
