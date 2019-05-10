# react4xp-build-components

**React4xp helper: basic webpack compilation of user-added React components in a React4xp structure**

Webpack config script for compiling user-added React JSX components in an [Enonic XP](https://enonic.com/developer-tour/web-application-platform) project. 

Babel support because ES6, and React of course. It's possible to go beyond that and [adjust or fine-tune this build step for your own needs](#adjusting-this-build-step).

## Jump to:
  - [Install](#install)
  - [Usage](#usage)
  - [Quick overview](#usage)
  - [More about the structure](#structure)
    - [Constants](#constants)
    - [Input](#input)
    - [Output](#output)
      - [Entries](#using-the-entries)
      - [Code splitting](#more-on-code-splitting)
      - [Externals](#externals)
  - [Adjusting this build step](#adjusting-this-build-step)


## Install

```bash
npm add --save-dev react4xp-build-components
```

## Usage

```bash
webpack --config node_modules/react4xp-build-components/webpack.config.js --env.REACT4XP_CONFIG_FILE=/me/myproject/build/react4xpConfig.json
```

...where `react4xpConfig.json` is a JSON file containing React4xp setup constants - see below.

## Quick overview

Running webpack like this, it will read your [constants](#constants) file (`react4xpConfig.json` in the example above) to see how the project's files and folders are structured. 

It looks for [JSX](https://reactjs.org/docs/introducing-jsx.html) files, either among your XP components folders (pages and parts), OR outside the XP structure (in a folder pointed to by the constant `SRC_R4X_ENTRIES` - `<rootDir>/src/main/resources/react4xp/_entries` by default). These first-level JSX files are called [Entries](#using-the-entries) below. 

The entries can import from other second-level JS/ES6/JSX files as usual.
 
  - Anything that's imported from `node_modules` in your project, will be compiled into a separate `vendors` chunk. 
  
  - Anything that's imported from _subfolders_ below `SRC_R4X` (default: `<rootDir>/src/main/resources/react4xp`), is compiled into chunks with the same name as the subfolder. 
  
  - Everything else is compiled into separate files, by the same name as each found Entry JSX file.

Everything's compiled into a target build folder (`BUILD_R4X` - `<rootDir>/build/resources/main/assets/react4xp` by default), ready to be consumed by the [React4xp runtime](https://github.com/enonic/lib-react4xp). In addition, the process creates a couple of JSON files, to guide the Runtime with dynamic filenames.



## Structure

### Constants

Use the [Webpack env parameter](https://webpack.js.org/guides/environment-variables/) `REACT4XP_CONFIG_FILE` to tell React4xp where to find a mandatory React4xp constants file. Full name and path are required. You can use [react4xp-buildconstants](https://www.npmjs.com/package/react4xp-buildconstants) to easily create a constants file.


### Input

Looks for, and handles, React component that you add to the project sourcecode structure. These components are of **three types**, depending on where you put them:

  - **Entry components**:
    - 1: [Components bound to XP components](#1-react-components-bound-to-XP-components)
    - 2: [Unbound components](#2-unbound-components)
  - **Dependency chunks**:
    - 3: [Shared components](#3-shared-components)

#### 1: React components bound to XP components: 
JSX files inside the Enonic XP file structure, in the same folder as an XP component that uses them. Called from the XP component's controller JS, and inserted into the component's view HTML - the [React4xp runtime](https://github.com/enonic/lib-react4xp) makes this very easy. Supported XP component types are currently pages and parts. Layouts might work, but this is not well tested so YMMV.  

React4xp needs to know the root of the Enonic XP structure: where to look for these JSX files. This is set with the `SRC_SITE` [constant](#constants), usually: `<rootDir>/src/main/resources/site`. 

Note that in order to avoid name collisions with XP's controller JS files, **the React component files must have a '.jsx' file name extension**. So obviously, other files in the structure must _not_, and you should avoid targeting the React4xp JSX files in other compile steps, for example if your XP controllers are ES6 files that need to be compiled.

This type of component is an [Entry](#using-the-entries) JSX file, and must export as `default` a function with a `props` argument (exporting pure HTML element in JSX works too) that returns a standard React component - for example:

```jsx harmony

// site/parts/example/example.jsx:

import React from 'react';
import WorldGreeter from "/path/to/WorldGreeter"

export default (props) => <WorldGreeter {...props} />;

```


#### 2: Unbound components: 
Callable JSX files put below a particular, designated source folder in your project. The source folder is controlled by the `SRC_R4X_ENTRIES` [constant](#constants). Default value is `<rootDir>/src/main/resources/react4xp/_entries`. The `_entries` subfolder name can be specifically controlled with the `R4X_ENTRY_SUBFOLDER` constant.

Entries put in this special folder will be available to the [React4xp runtime](https://github.com/enonic/lib-react4xp) from _anywhere_, for client-side and/or server-side rendering.

Also an [Entry](#using-the-entries) type, so the same rules apply to the files here too: use '.jsx' file extension and expose a _props -> component_ function from `default` (see the example above). 
 

#### 3: Shared components:
JSX files _used by the entry components_: the entries import shared components. During compilation the shared components are [packed into component chunks](#more-on-code-splitting): runtime libraries that contain everything the entries need. 

Shared component source files are put below the main React4xp source folder in your project source, also controllable by a [constant](#constants) you can set: `SRC_R4X` (default: `<rootDir>/src/main/resources/react4xp`). **Put shared components in subfolders** below that - this will put them into [optimized chunks with the same name as the subfolder](#more-on-code-splitting). Just avoid the special folder pointed to by `R4X_ENTRY_SUBFOLDER`, which is only used for entries. 

Note that source files that aren't imported by entries will not be compiled to the build folder at all. And if you add source files right on the root of `<rootDir>/src/main/resources/react4xp/` (or wherever `SRC_R4X` points), they will be bundled into the entry files that use them, instead of a chunk - increasing the entry's size!

The shared-component syntax is just regular React: a JSX file that exports as default _either_ a React stateless function component (a _props -> component_ function)...


```jsx harmony
import React from 'react';

const WorldGreeter = (props) => <p>Hello {props.greetee}!</p>;

export default WorldGreeter;
```

..._or_ as a stateful class component, for example:

```jsx harmony
import React from 'react';

class WorldGreeter expands React.Component {
    constructor(props) {
        this.state = {
            greetee: props || "world",
        }
    }
    
    render() {
        return (<p>Hello {this.state.greetee}!</p>);
    }
}

export default (props) => <WorldGreeter {...props} />;
```




### Output

Compiles everything into a designated React4xp output folder, controllable by the `BUILD_R4X` [constant](#constants) (default: `<rootDir>/build/resources/main/assets/react4xp`):
  - Component entry files
  - Shared dependency chunks for components and vendors libraries
  - A JSON data file, `chunks.json`, that contains the file names of all the components and chunks (necessary for the runtime to know the built hashed names), 
  - `entries.json` that contains the runtime names of all the compiled entry components (lets the runtime know what are the dependencies. Also useful for developers to see what components are available in runtime)


#### Using the entries
 
**React4xp Entries** are a common word for the components below the folders `SRC_SITE` and `SRC_R4X_ENTRIES`. They are runtime-callable part of a component: JS files that are a React "app" of their own, a top-level React component. These are what will be fed into the [React4xp runtime](https://github.com/enonic/lib-react4xp) renderer. 

Since the dependency chunks are more optimized for re-use, the ideal use of entries are simply as triggers/containers, minimal wrappers that just import  the actual components from the library chunks. 
 
Each entry component has a name in runtime, or rather an **entry path** (called `jsxPath` in code). This name is defined by the file path of the JSX file, relative to the source folders (`<rootDir>/src/main/resources/site` or `<rootDir>/src/main/resources/react4xp/_entries`, or rather: wherever `SRC_SITE` and `SRC_R4X_ENTRIES` are pointing). It's also the path to the compiled files under `<rootDir>/build/resources/main/assets/react4xp` (or actually `BUILD_R4X`).

Running the entry files and chunks in runtime, makes the components callable under a global object called `React4xp` (can be controlled with the constant `LIBRARY_NAME`). The entry name is also used for fetching the component code in runtime, exposed by the [React4xp runtime service](https://github.com/enonic/lib-react4xp), which looks for the compiled file under `BUILD_R4X`.

**For example:**
  - `<rootDir>/src/main/resources/react4xp/_entries / Example.jsx` will be compiled to `<rootDir>/build/resources/main/assets/react4xp/Example.js` and has the name `Example`. It can be called in runtime as `React4xp.Example()`.
  - `<rootDir>/src/main/resources/site / parts/example/example/example2.jsx` is compiled to `<rootDir>/build/resources/main/assets/react4xp/site / parts/example/example/example2.jsx` has the entry name `site/parts/example/example2`, and is called as `React4xp['site/parts/example/example2']()`
  - ...etc...


#### More on code splitting

Like other shared and heavily re-used libraries in the React4xp structure, the chunks are optimized for being shared across multiple components pages, downloaded once and cached in the client, and reused when revisiting a page. Therefore, the chunks are [content-hased for effective HTTP client caching and cache busting](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching). This is handled entirely by the [React4xp runtime](https://github.com/enonic/lib-react4xp) out of the box. The _react4xp-build-components_ build process produces JSON files with the hashed file names, used by the runtime for reference. This way, the compiled output is layered by [code splitting](https://webpack.js.org/guides/code-splitting/). Third-party dependencies in `node_modules` are split out to a separate chunk: `vendors.<HASH>.js`. You can use the names of subfolders below the `SRC_R4X` folder (see the [constants](#constants)) to control which dependencies go in which chunk.

Currently, there is no dependency specificity detected in the build. So the runtime libs won't know which dependency chunks are needed from any one entry. This means all the dependency chunks are downloaded when an entry is needed. However, with successful HTTP client caching, this should only very rarely be noticeable after the first time.

#### Externals

If you set the `EXTERNALS` [constant](#constants) object, it will be used as the `externals` value in this webpack config script. You can use the same config file with the [react4xp-runtime-externals](https://www.npmjs.com/package/react4xp-runtime-externals) helper, which will then build those libraries the same way as other dependencies but in a chunk of their own, nicely handled by the React4xp runtime. This allows them to function as regular webpack externals in the client, AND be used as dependencies for the react4xp runtime. This is also a different, easy way to insert additional dependency libraries that are needed both in client- and server-side runtime.

Supported syntax is as a straight object in the config JSON file, for example in `react4xpConfig.json`:

```json
{ 
  ...

  "EXTERNALS": {
    "react": "React",
    "react-dom": "ReactDOM",
    "library-name": "ReferenceInCode"    
  },
  
  ...
}
```

Note that libraries declared as externals like this will not be available to the server-side runtime unless you use the [react4xp-runtime-externals](https://www.npmjs.com/package/react4xp-runtime-externals) helper.

[More about webpack externals](https://webpack.js.org/configuration/externals/)


## Adjusting this build step

This config only handles fairly basic React/ES6 compilation. It's pretty likely that you will need to fine-tune this setup for your own needs. You're encouraged to copy and expand the `webpack.config.js` from here as a template - especially the `module.rules` section can be useful to change. 

If you do, it's recommended you still [use a config file for React4XP as described below](#structure), and keep the steps using `react4xp-build-entriesandchunks` and `chunks-2-json-webpack-plugin`. They detect the added React component files and build the entry overview, normalize the structure into what the other React4xp steps expect, especially the runtime, and make sure everything fits together.
