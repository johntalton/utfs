import { UTFS_MAX_FILENAME } from './defs.js'

/** @import { FileSystem, Header, Data,  } from './defs.js' */


export const FILE_NAME_BUFFER_SIZE = UTFS_MAX_FILENAME + 1
export const STATIC_HEADER_SIZE = 12
export const HEADER_LENGTH = STATIC_HEADER_SIZE + FILE_NAME_BUFFER_SIZE


export class Common {
	/**
	 * @param {FileSystem} fs
	 * @param {number} offset
	 * @param {Header} header
	 */
	static async writeHeader(fs, offset, header) {
		const headerBuffer = new ArrayBuffer(HEADER_LENGTH)
		const dv = new DataView(headerBuffer)

		const littleEndian = false
		dv.setUint16(0, header.identifier, littleEndian)
		dv.setUint8(2, header.version)
		dv.setUint8(3, header.flags)
		dv.setUint16(4, header.signature, littleEndian)
		// dv.setUint16(6, header.reserved, littleEndian)
		dv.setUint32(8, header.size, littleEndian)

		const filenameBuffer = new Uint8Array(headerBuffer, dv.byteOffset + STATIC_HEADER_SIZE, FILE_NAME_BUFFER_SIZE)
		fs.encoder.encodeInto(header.filename, filenameBuffer)

		return fs.writeFn(offset, headerBuffer, HEADER_LENGTH)
	}

	/**
	 * @param {FileSystem} fs
	 * @param {number} offset
	 * @returns {Promise<Header>}
	 */
	static async readHeader(fs, offset) {
		const ab = await fs.readFn(offset, HEADER_LENGTH)

		if(ab.byteLength < HEADER_LENGTH) { throw new RangeError('read size not adequate for header') }

		const dv = ArrayBuffer.isView(ab) ?
			new DataView(ab.buffer, ab.byteOffset, ab.byteLength) :
			new DataView(ab, 0, ab.byteLength)

		const littleEndian = false
		const identifier = dv.getUint16(0, littleEndian)
		const version = dv.getUint8(2)
		const flags = dv.getUint8(3)
		const signature = dv.getUint16(4, littleEndian)
		const reserved = dv.getUint16(6, littleEndian)
		const size = dv.getUint32(8, littleEndian)

		const filenameBuffer = new Uint8Array(dv.buffer, dv.byteOffset + STATIC_HEADER_SIZE, FILE_NAME_BUFFER_SIZE)
		const filename = fs.decoder.decode(filenameBuffer)

		return {
			identifier,
			version,
			flags,
			signature,
			reserved,
			size,
			filename
		}
	}

	/**
	 * @param {FileSystem} fs
	 * @param {number} offset
	 * @param {Data} data
	 * @param {number} length
	 */
	static writeData(fs, offset, data, length) {
		return fs.writeFn(offset, data, length)
	}

	/**
	 * @param {FileSystem} fs
	 * @param {number} offset
	 * @param {number} length
	 * @returns {Promise<Data>}
	 */
	static readData(fs, offset, length) {
		return fs.readFn(offset, length)
	}
}
