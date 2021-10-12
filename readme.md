https://user-images.githubusercontent.com/2223602/126318148-99da7ed6-a578-48dd-bdd2-21056dbad003.mp4

<br />
<br/>

[![Version](https://img.shields.io/npm/v/@react-three/gltfjsx?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/gltfjsx) [![Discord Shield](https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=ffffff)](https://discord.gg/ZZjjNvJ)

A small command-line tool that turns GLTF assets into declarative and re-usable [react-three-fiber](https://github.com/pmndrs/react-three-fiber) JSX components.

### Why? Because the GLTF workflow on the web is deeply flawed ...

- They're dumped wholesale into the scene which prevents re-use, in threejs objects can only be mounted once
- Contents can only be found out by traversal which is cumbersome and slow
- Changes to queried nodes are made by mutation, which alters the source data and, again, prevents re-use
- Re-structuring content, making nodes conditional or adding/removing them is cumbersome

Gltfjsx creates a virtual, nested graph of all the objects and materials inside your asset. It will not touch or modify your files in any way. Now you can easily make the data dynamic, alter contents, add events, or re-use the asset without having to re-parse and clone, as it is usually done.

## Usage

```bash
Usage
  $ npx gltfjsx [Model.js] [options]

Options
  --types, -t         Add Typescript definitions
  --keepnames, -k     Keep original names
  --keepgroups, -K    Keep (empty) groups
  --meta, -m          Include metadata (as userData)
  --shadows, s        Let meshes cast and receive shadows
  --printwidth, w     Prettier printWidth (default: 120)
  --precision, -p     Number of fractional digits (default: 2)
  --draco, -d         Draco binary path
  --root, -r          Sets directory from which .gltf file is served
  --instance, -i      Instance re-occuring geometry
  --instanceall, -I   Instance every geometry (for cheaper re-use)
  --transform, -T     Transform the asset for the web (draco, prune, resize)
  --debug, -D         Debug output
```

### A typical use-case

First you run your model through gltfjsx. `npx` allows you to use npm packages without installing them.

```bash
npx gltfjsx model.gltf
```

It creates a javascript file that plots out all of the assets contents. The original gltf must still be be in your `/public` folder of course.

```jsx
/*
auto-generated by: https://github.com/pmdrs/gltfjsx
author: abcdef (https://sketchfab.com/abcdef)
license: CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
source: https://sketchfab.com/models/...
title: Model
*/

import { useGLTF, PerspectiveCamera } from '@react-three/drei'

export default function Model(props) {
  const { nodes, materials } = useGLTF('/model.gltf')
  return (
    <group {...props} dispose={null}>
      <group name="camera" position={[10, 0, 50]} rotation={[Math.PI / 2, 0, 0]}>
        <PerspectiveCamera fov={40} near={10} far={1000} />
      </group>
      <group name="sun" position={[100, 50, 100]} rotation={[-Math.PI / 2, 0, 0]}>
        <pointLight intensity={10} />
      </group>
      <mesh geometry={nodes.robot.geometry} material={materials.metal} />
      <mesh geometry={nodes.rocket.geometry} material={materials.wood} />
    </group>
  )
}

useGLTF.preload('/model.gltf')
```

This component can now be dropped into your scene. It is asynchronous and therefore must be wrapped into `<Suspense>` which gives you full control over intermediary loading-fallbacks and error handling.

```jsx
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Model from './Model'

function App() {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Model />
      </Suspense>
```

Now you could re-use it:

```jsx
<Model position={[0, 0, 0]} />
<Model position={[10, 0, -10]} />
```

Or make the model dynamic. Change its colors for example:

```jsx
<mesh geometry={nodes.robot.geometry} material={materials.metal} material-color="green" />
```

Or exchange materials:

```jsx
<mesh geometry={nodes.robot.geometry}>
  <meshPhysicalMaterial color="hotpink" />
</mesh>
```

Make contents conditional:

```jsx
{
  condition && <mesh geometry={nodes.robot.geometry} material={materials.metal} />
}
```

Add events:

```jsx
<mesh geometry={nodes.robot.geometry} material={materials.metal} onClick={handleClick} />
```

## Features

#### ⚡️ Draco and meshopt compression ootb

You don't need to do anything if your models are draco compressed, since `useGLTF` defaults to a [draco CDN](https://www.gstatic.com/draco/v1/decoders/). By adding the `--draco` flag you can refer to [local binaries](https://github.com/mrdoob/three.js/tree/dev/examples/js/libs/draco/gltf) which must reside in your /public folder.

#### ⚡️ Easier access to animations

If your GLTF contains animations it will add [drei's](https://github.com/pmndrs/drei) `useAnimations` hook, which extracts all clips and prepares them as actions:

```jsx
const { nodes, materials, animations } = useGLTF('/model.gltf')
const { actions } = useAnimations(animations, group)
```

If you want to play an animation you can do so at any time:

```jsx
<mesh onClick={(e) => actions.jump.play()} />
```

If you want to blend animations:

```jsx
const [name, setName] = useState("jump")
...
useEffect(() => {
  actions[name].reset().fadeIn(0.5).play()
  return () => actions[name].fadeOut(0.5)
}, [name])
```

#### ⚡️ Preload your assets for faster response

The asset will be preloaded by default, this makes it quicker to load and reduces time-to-paint. Remove the preloader if you don't need it.

```jsx
useGLTF.preload('/model.gltf')
```

#### ⚡️ Type-safety

Add the `--types` flag and your GLTF will be typesafe.

```tsx
type GLTFResult = GLTF & {
  nodes: { robot: THREE.Mesh; rocket: THREE.Mesh }
  materials: { metal: THREE.MeshStandardMaterial; wood: THREE.MeshStandardMaterial }
}

export default function Model(props: JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF<GLTFResult>('/model.gltf')
```

#### ⚡️ Auto-transform (compression, resize)

With the `--transform` flag it creates a binary-packed, draco-compressed, texture-resized (1024x1024), deduped and pruned GLTF ready to be consumed on a web site. It uses [glTF-Transform](https://github.com/donmccurdy/glTF-Transform). It will not alter the original but create a copy and append `[modelname]-transformed.glb`.

## Using the parser stand-alone

```jsx
import { parse } from '@react-three/gltfjsx'
import { GLTFLoader, DRACOLoader } from 'three-stdlib'

const gltfLoader = new GLTFLoader()
const dracoloader = new DRACOLoader()
dracoloader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
gltfLoader.setDRACOLoader(dracoloader)

gltfLoader.load(url, (gltf) => {
  const jsx = parse(filename, gltf, config)
})
```

## Using GLTFStructureLoader stand-alone

The GLTFStructureLoader can come in handy while testing gltf assets. It allows you to extract the structure without the actual binaries and textures making it possible to run in a testing environment.

```jsx
import { GLTFStructureLoader } from '@react-three/gltfjsx'
import fs from 'fs/promises'

it('should have a scene with a blue mesh', async () => {
  const data = await fs.readFile('./model.glb')
  const { scene } = await new Promise((res) => loader.parse(data, '', res))
  expect(() => scene.children.length).toEqual(1)
  expect(() => scene.children[0].type).toEqual('mesh')
  expect(() => scene.children[0].material.color).toEqual('blue')
})
```

## Requirements

- Nodejs must be installed
- The GLTF file has to be present in your projects `/public` folder
- [three](https://github.com/mrdoob/three.js/) (>= 121.x)
- [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) (>= 5.x)
- [@react-three/drei](https://github.com/pmndrs/drei) (>= 2.x)
