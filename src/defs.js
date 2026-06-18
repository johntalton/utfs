/** biome-ignore-all lint/style/useNumericSeparators: unneeded */

/** @typedef {number} Result */

/** @typedef {ArrayBufferView | ArrayBufferLike} Data */

/** @typedef {number} Flags */
/** @typedef {number} Options */

/** @typedef {(address: number, length: number) => Promise<Data>} SysRead */
/** @typedef {(address: number, data: Data, length: number) => Promise<number>} SysWrite */

/**
 * @typedef {Object} FileSystem
 * @property {Array<File|undefined>} file_list
 * @property {boolean} structure_saved
 * @property {boolean} verbose
 * @property {number} baseAddress
 *
 * @property {SysRead} readFn
 * @property {SysWrite} writeFn
 *
 * @property {Intl.Collator} collator
 * @property {TextEncoder} encoder
 * @property {TextDecoder} decoder
 */

/**
 * @typedef {Partial<Pick<FileSystem, 'verbose'|'baseAddress'|'collator'|'encoder'|'decoder'>> & Pick<FileSystem, 'readFn'|'writeFn'>} FSOptions
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

export const FLAGS_MASK = 0xFF00
export const FLAGS_MASK_INVERSE = 0x00FF

export const UTFS_RESULT = {
	RES_OK:              0,
	RES_FILE_NOT_FOUND:  1,
	RES_READ_ERROR:      2,
	RES_WRITE_ERROR:     3,
	RES_PARAM_ERROR:     4,
	RES_FILENAME_EXISTS: 5,
	RES_FILESYSTEM_FULL: 6,
	RES_INVALID_FS:      7
}

export const UTFS_FLAGS = {
		UTFS_NO_FLAGS:      0x0000,
		UTFS_EXT_ATTR:      0x0001,
		UTFS_LOAD_EXPLICIT: 0x0100,
		UTFS_SAVE_EXPLICIT: 0x0200,
}

export const UTFS_OPTIONS = {
	UTFS_NO_OPT:       0x00,
	UTFS_OPT_REPLACE:  0x01,
}


