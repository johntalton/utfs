# UTFS

Micro TAR File System ([reference](https://github.com/clisystems/utfs)).

Utilizes a fixed layout (similar to a TAR file) that is intended to be read/written as a single chunk.  Making it ideal for EEPROM like systems.

## Other Useful Filesystems for EEPROM

- [NASA EEFS](https://github.com/johntalton/eefs) Provides robust and full featured filesystem.
- [CyclicFS](https://github.com/johntalton/cyclic-fs) Provides continuous write style in a stride of chunks.

## Example
Create a FileSystem reference the wraps the devices core `readFn` and `writeFn` functions.

Add a single referenced file via `register`, and then `save` the entire structure to the device.

```js
import { UTFS } from '@johntalton/utfs'
import { readFn, writeFn } from 'some device implementation'

const fs = UTFS.init({
  readFn
  writeFn
})

const file = {
  filename: 'appData',
  data: Uint8Array.from([ 42, 77 ])
  // ...
}

const registerResult = UTFS.register(fs, file)

// write down to core device
const saveResult = UTFS.save(fs)

```
