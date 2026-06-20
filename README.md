# UTFS

[![npm Version](http://img.shields.io/npm/v/@johntalton/utfs.svg)](https://www.npmjs.com/package/@johntalton/utfs)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/utfs)
[![CI](https://github.com/johntalton/utfs/actions/workflows/CI.yml/badge.svg)](https://github.com/johntalton/utfs/actions/workflows/CI.yml)

Micro TAR File System ([reference](https://github.com/clisystems/utfs)).

Utilizes a fixed layout (similar to a TAR file) that is intended to be read/written as a single chunk.  Making it ideal for EEPROM like systems.

## Other Useful Filesystems for EEPROM

- [NASA EEFS](https://github.com/johntalton/eefs) Provides robust and full featured filesystem.
- [CyclicFS](https://github.com/johntalton/cyclic-fs) Provides continuous write style in a stride of chunks.

## EEPROM device library

Using the [EEPROM library](https://github.com/johntalton/eeprom) as a core to provide the `readFn` and `writeFn` implementation (or similar) is recommended for physical device interactions.

## Example
Create a FileSystem reference the wraps the devices core `readFn` and `writeFn` functions.

Add a single referenced file via `register`, and then `save` the entire structure to the device.

```sh
npm i @johntalton/utfs
```

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

### Configure filename handling

Filename strings are handled using the default `TextEncoder` and `TextDecoder` as well as `Intl.Collator`.

Their configuration / implementation can be overridden in the `init` function.

```js
//
const fs = UTFS.init({
  readFn, writeFn,

  // default
  collator: new Intl.Collator('en'),
  encoder: new TextEncoder(),
  decoder: new TextDecoder('utf-8', {
    fatal: true,
    ignoreBOM: false
  })
})

```