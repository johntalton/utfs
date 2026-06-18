
/** @typedef {number & { __brand: 'result' }} Result */

/** @typedef {ArrayBufferView | ArrayBufferLike} Data */

/** @typedef {number} Flags */
/** @typedef {number} Options */

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


/** @type {Record<string, Result>} */
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
	}
	return 'RES_UNKNOWN'
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


export class UTFS {
	/**
	 * @param {boolean} verbose
	 * @returns {Result}
	 */
	static init(verbose) {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @param {number} baseAddress
	 * @returns {Result}
	 */
	static baseaddress_set(baseAddress) {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @param {File} file
	 * @param {Flags} flags
	 * @param {Options} options
	 * @returns {Result}
	 */
	static register(file, flags, options) {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @param {File} file
	 * @returns {Result}
	 */
	static unregister(file) {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @returns {Result}
	 */
	static load() {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @returns {Result}
	 */
	static save() {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @returns {Result}
	 */
	static save_flush() {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @param {File} file
	 * @returns {Result}
	 */
	static load_file(file) {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @param {File} file
	 * @returns {Result}
	 */
	static save_file(file) {
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
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @param {File} file
	 * @param {string} name
	 * @returns {Result}
	 */
	static set_filename(file, name) {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @param {File} file
	 * @param {Data} data
	 * @param {number} size
	 * @returns {Result}
	 */
	static set_data(file, data, size) {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @param {File} file
	 * @returns {number}
	 */
	static file_signature(file) {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @param {File} file
	 * @param {number} signature
	 * @returns {Result}
	 */
	static file_signature_set(file, signature) {
		return UTFS_RESULT.RES_INVALID_FS
	}

	/**
	 * @returns {Result}
	 */
	static status() {
		return UTFS_RESULT.RES_INVALID_FS
	}
}
