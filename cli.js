#!/usr/bin/env node
'use strict'
import meow from 'meow'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import gltfjsx from './src/gltfjsx.js'
import { readPackageUpSync } from 'read-pkg-up'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const cli = meow(
  `
	Usage
	  $ npx gltfjsx [Model.glb] [options]

	Options
    --output, -o        Output file name/path
    --types, -t         Add Typescript definitions
    --keepnames, -k     Keep original names
    --keepgroups, -K    Keep (empty) groups, disable pruning
    --bones, -b         Lay out bones declaratively (default: false)
    --meta, -m          Include metadata (as userData)
    --shadows, s        Let meshes cast and receive shadows
    --printwidth, w     Prettier printWidth (default: 120)
    --precision, -p     Number of fractional digits (default: 3)
    --draco, -d         Draco binary path
    --root, -r          Sets directory from which .gltf file is served
    --instance, -i      Instance re-occuring geometry
    --instanceall, -I   Instance every geometry (for cheaper re-use)
    --exportdefault, -E Use default export
    --transform, -T     Transform the asset for the web (draco, prune, resize)
      --resolution, -R  Resolution for texture resizing (default: 1024)
      --keepmeshes, -j  Do not join compatible meshes      
      --keepmaterials, -M Do not palette join materials
      --format, -f      Texture format (default: "webp")
      --simplify, -S    Mesh simplification (default: false)
        --weld          Weld tolerance (default: 0.00005)
        --ratio         Simplifier ratio (default: 0)
        --error         Simplifier error threshold (default: 0.0001)
    --debug, -D         Debug output
`,
  {
    importMeta: import.meta,
    flags: {
      output: { type: 'string', shortFlag: 'o' },
      types: { type: 'boolean', shortFlag: 't' },
      keepnames: { type: 'boolean', shortFlag: 'k' },
      keepgroups: { type: 'boolean', shortFlag: 'K' },
      bones: { type: 'boolean', shortFlag: 'b', default: false },
      shadows: { type: 'boolean', shortFlag: 's' },
      printwidth: { type: 'number', shortFlag: 'p', default: 1000 },
      meta: { type: 'boolean', shortFlag: 'm' },
      precision: { type: 'number', shortFlag: 'p', default: 3 },
      draco: { type: 'string', shortFlag: 'd' },
      root: { type: 'string', shortFlag: 'r' },
      instance: { type: 'boolean', shortFlag: 'i' },
      instanceall: { type: 'boolean', shortFlag: 'I' },
      transform: { type: 'boolean', shortFlag: 'T' },
      resolution: { type: 'number', shortFlag: 'R', default: 1024 },
      degrade: { type: 'string', shortFlag: 'q', default: '' },
      degraderesolution: { type: 'number', shortFlag: 'Q', default: 512 },
      simplify: { type: 'boolean', shortFlag: 'S', default: false },
      keepmeshes: { type: 'boolean', shortFlag: 'j', default: false },
      keepmaterials: { type: 'boolean', shortFlag: 'M', default: false },
      format: { type: 'string', shortFlag: 'f', default: 'webp' },
      exportdefault: { type: 'boolean', shortFlag: 'E' },
      weld: { type: 'number', default: 0.0001 },
      ratio: { type: 'number', default: 0.75 },
      error: { type: 'number', default: 0.001 },
      debug: { type: 'boolean', shortFlag: 'D' },
    },
  }
)

const { packageJson } = readPackageUpSync({ cwd: __dirname, normalize: false })

if (cli.input.length === 0) {
  console.log(cli.help)
} else {
  const config = {
    ...cli.flags,
    header: `Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@${packageJson.version} ${process.argv.slice(2).join(' ')}`,
  }
  const file = cli.input[0]
  let nameExt = file.match(/[-_\w\d\s]+[.][\w]+$/i)[0]
  let name = nameExt.split('.').slice(0, -1).join('.')
  const output = config.output ?? name.charAt(0).toUpperCase() + name.slice(1) + (config.types ? '.tsx' : '.jsx')
  const showLog = (log) => {
    console.info('log:', log)
  }
  try {
    const response = await gltfjsx(file, output, { ...config, showLog, timeout: 0, delay: 1 })
  } catch (e) {
    console.error(e)
  }
}
