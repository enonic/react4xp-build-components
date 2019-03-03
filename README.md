# react4xp-build-components

**React4xp helper: basic webpack compilation of React components in a React4xp structure**

Webpack config script for compiling user-added React JSX components in an [Enonic XP](https://enonic.com/developer-tour/web-application-platform) project. 

This config only handles fairly basic React compilation, it's likely that you will need to fine-tune this setup for your own project. You're encouraged to copy and expand the `webpack.config.js` from here as a template. If you do, it's recommended you still [use a config file for React4XP as described below](#constants-and-structure), and keep the steps using `react4xp-build-entriesandchunks` and `chunks-2-json-webpack-plugin`. They detect the added React component files and builds the entry overview, normalize the structure into what the other React4xp steps expect, especially the runtime, and make sure everything fits together.

Babel support, for the glory of ES6.

  - [Install](#install)
  - [Structure](#structure)
    - [Constants](#constants)
    - [Input](#input)
      - [React components bound to XP components](#1-react-components-bound-to-XP-components)
      - [Unbound components](#2-unbound-components)
      - [Shared components](#3-shared-components)
    - [Output](#output)


## Install

```bash
npm add --save-dev react4xp-build-components
```

## Structure

### Constants

React4xp has several steps that are necessary to work smoothly. You can use it out-of-the-box bys stringing the helpers and libraries together as-is, or you can fork/modify/override/mess with each of the steps as you want - but they role each of them plays is mandatory and shouldn't be skipped (with one exception: [building your own externals chunk](https://www.npmjs.com/package/react4xp-runtime-externals) is optional).

Binding these steps together is **a JSON file with a set of constants that sync together each step and what they're is doing**. Creating this file is easily done with the [react4xp-buildconstants](https://www.npmjs.com/package/react4xp-buildconstants) helper, see the react4xp-buildconstants documentation for [the full structure it creates in the JSON file](https://www.npmjs.com/package/react4xp-buildconstants#output). This defines a React4xp project structure, and if you decide to make your own constants file manually, you'll still need to stick to that structure inside it (at least the upper-case attributes. The `recommended` attribute only contains suggestions used only one place. Use hardcoded values instead if you want, for example instead of `recommended.buildEntriesAndChunks.ENTRY_SETS` in `webpack.config.js` here.

The JSON config file can be wherever you want. When running this webpack script, use the [Webpack env parameter](https://webpack.js.org/guides/environment-variables/) `REACT4XP_CONFIG_FILE` to tell the script where to find it. Full path and name are needed. For example, using this package directly after installing:

```bash
webpack --config node_modules/react4xp-build-components/webpack.config.js --env.REACT4XP_CONFIG_FILE=/me/myproject/build/react4xpConfig.json
```

### Input

Looks for, and handles, React component that you add to the project sourcecode structure. These components are of three types, depending on where you put them:

#### 1: React components bound to XP components: 
JSX files inside the XP file structure, intended to be called from the component's controller JS, and inserted into the component's view HTML. Made to be easy to develop and use with XP, tailored for the [React4xp runtime](FIXME: get link). Supported XP component types are currently pages and parts. Layouts might work, but this is not well tested so YMMV. The basic use case is to put JSX files in the same folder as the XP component that uses them. 

Note that in order to avoid name collisions with XP's controller JS files, **the React component files must have a '.jsx' file name extension**. So obviously, other files must not, and you should avoid compiling these JSX files in other build steps, for example if your XP controllers are ES6 files that need to be compiled in themselves. _react4xp-build-components_ won't touch these for you. 

React4xp needs to know the root of the XP structure: where to look for these. This is set with the `SRC_SITE` [constant](#constants), usually: `"<rootDir>/src/main/resources/site"`. 

This type of component is an [Entry](#using-the-entries) JSX file, and must export as `default` a function with a `props` argument (exporting pure HTML element in JSX works too) that returns a standard React component.

##### Example:

```jsx harmony
// site/parts/example/example.jsx:

import React from 'react';

export default (props) => <p>Hello {props.worldOrSomething}!</p>;
```
  
#### 2: Unbound components: 
Callable JSX files put below a particular, designated source folder in your project. After compilation, it will be available to the [React4xp runtime](FIXME: GET LINK TO THE RUNTIME LIB) from _anywhere_, for client-side and/or server-side rendering. The source folder is controlled by the `SRC_R4X_ENTRIES` [constant](#constants). Default value is `"<rootDir>/src/main/react4xp/_components"`. The "_component" subfolder name can be specifically controlled with the `R4X_ENTRY_SUBFOLDER` constant.

#### 3: Shared components:
As opposed to the [XP-bound](#1-react-components-bound-to-xp-components) and [unbound](#2-unbound-components) components mentioned above (which both are called [Entries](#using-the-entries) because they are callable in runtime), shared components are JSX files _used by the entries_: the entries import shared components. During compilation the shared components are [packed into component chunks](#more-on-code-splitting): runtime libraries that contain everything the entries need. Shared component source files are put below the main react4xp source folder in your project source, also controllable by a constant you can set: `SRC_R4X` (default: `"<rootDir>/src/main/react4xp"`). If shared-component JSX files are put at the root of that folder, they will be packed into the entry files, making them bigger: so it's better to **put shared components in subfolders** - this will [create chunks with the same name as the subfolder](#more-on-code-splitting). Just avoid the special folder pointed to by `R4X_ENTRY_SUBFOLDER`, which is only used for entries.


### Output

Compiles everything into a designated React4xp output folder, controllable by the `BUILD_R4X` [constant](#constants) (default: `"<rootDir>/build/resources/main/react4xp"`):
  - Component entry files
  - Shared dependency chunks for components and vendors libraries
  - A JSON data file, `chunks.json`, that contains the file names of all the components and chunks (necessary for the runtime to know the built hashed names), 
  - `entries.json` that contains the runtime names of all the compiled entry components (lets the runtime know what are the dependencies. Also useful for developers to see what components are available in runtime)


#### Using the entries
 
**React4xp Entries** are a common word for the components below the folders `SRC_SITE` and `SRC_R4X_ENTRIES`. They are runtime-callable part of a component: JS files that are a React "app" of their own, a top-level React component. Ideally, they are just minimal wrappers that import link the renderable  These are what will be fed into the React renderer, available to and runnable by the browser and importing other components. JSX files will be interpreted as React entries if the source files are found under the common XP structire (`src/main/resources/site`) or under a designated directory in React4xp itself (`src/main/react4xp/_components`). 

Entry components have a name in runtime, or rather an **entry path** (called `jsxPath` in code). This name is defined by the file path of the JSX file, relative to the source folders (`<rootDir>/src/main/resources/site` or `<rootDir>/src/main/react4xp/_components`, or rather: wherever `SRC_SITE` and `SRC_R4X_ENTRIES` are pointing). It's also the path to the compiled files under `<rootDir>/build/resources/main/react4xp` (or actually `BUILD_R4X`). Entries don't have hashed names: they should be small, top-level references, wrappers that import the actual action from shared components.

Running the entry files and chunks in runtime, makes the components callable under a global object called `React4xp` (can be controlled with the constant `LIBRARY_NAME`). The entry name is also used for fetching the component code in runtime, exposed by the [React4xp runtime service](FIXME: GET LINK), which looks for the compiled file under `BUILD_R4X`.

##### Examples:
  - `<rootDir>/src/main/react4xp/_components / Example.jsx` will be compiled to `<rootDir>/build/resources/main/react4xp/Example.js` and has the name `Example`. It can be called in runtime as `React4xp.Example()`.
  - `<rootDir>/src/main/resources/site / parts/example/example/example.jsx` has the entry name `site/parts/example/example`, etc


#### More on code splitting

Like other shared and heavily re-used libraries in the React4xp structure, these chunks are [content-hased for effective HTTP client caching and cache busting](#more-on-code-splitting). This is handled entirely by the React4xp runtime, using JSON files that also are produced by the react4xp-build-components build process. 

Sets up [code splitting](https://webpack.js.org/guides/code-splitting/) and layers the compiled output. This is done for performance by [client-side HTTP caching](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching): the chunks/vendors bundle frequently used common dependencies into one, or a few, files that can be loaded client-side ideally just once, and be cached there for fast responsive pages (no need for PWA caching). Everything except the entries get a **content-dependent hash** added to the file name, so it only changes on actual updates to the dependencies. These hashes are exported by webpack to `chunks.*.json` files, which are used by XP to resolve the dependency file names. There's also a built `entries.json` file, which both allows developers to look up available entries, and lets the library exclude the entries from the hashed-name handling.

#### Externals











  - **Entries**: 

  - **Chunks**: second-level bundles/libraries of shared React (or other) components, importable by the entries. You can force shared code to be bundled into a chunk without changing the webpack.config files: simply put the shared code into `.es6` or `.jsx` files in subdirectories below `src/main/react4xp` and import it from your entries. The build does the rest.

  - **Externals**: third-level and third-party libraries such as React itself, needed both at client and server side. At this level might also be a **vendors** chunk: the leftover, non-externals common deplendencies from `node_modules/`. Use the EXTERNALS object in `webpack.config.constants.json` to separate between externals and vendors chunks.

Because the layers are differently used and have different needs for chunking and hashing strategies, there are 4 webpack steps, each triggered by separate gradle tasks and each with their own `webpack.config.*.js`. In addition to entries, chunks and externals, there's the React4xp frontend-only Core and the backend-only Nashorn polyfills. 
  
### Entries and Core

React component entries can be used by XP by referring to their entry paths (`jsxPath`, unless the XP component is used as a shortcut like in the example). This path is both part of the URL for the component file, and the reference to the component in the client-side script. The global client-side `React4xp` object has some basic `Reac4xp.Core` code that wraps the React renderer, as well as entry path attributes that expose the react components. Reac4xp.Core is built from `src/main/react4xp/clientsideRendering.es6`.

For example, in the hello-world example above, the entry path of `example.jsx` is `"site/parts/example/example"`, so it could also have been rendered with `React4xp.render(request, "site/parts/example/example"):`. Either way, the browser downloads ...`_/service/com.enonic.starter.react/react4xp/site/parts/example/example.js` and calls `React4xp.Core.render` with `React4xp['site/parts/example/example'].default`.       


### The library: `lib/enonic/react4xp/index.es6` 

Used in XP controllers. Relies on webpack having done its job (setting up the entry paths, the hashed chunk names and the correct placement of all the files), and handles the interplay between backend and frontend mainly using the entry paths. In addition to the `.render` method from the hello-world example are some other options:
  - `React4xp.renderSSR(params)`: Same as React4xp.render, but without the `request`, and always renders static server-side markup. No need for a `request` argument. Worth noting: the first server-side rendering in Nashorn is much slower than repeated calls to the same component. The component is cached as a function, so re-calling it even with different props will be much more performant. 
  - `React4xp.renderClient(params)`: Same as React4xp.renderSSR, but always renders active client-side react. Might nota always work so well in XP content studio's edit mode).
  - `React4xp.renderMarkupAndHydrate(params)`: Same as React4xp.renderSSR, but also tries to activate the component (hydrate; populate the previously rendered DOM with active react functionality). As above, your mileage might vary when it comes to how it behaves in XP content studio's edit mode.
  
For more fine-grained control, build a **React4xp instance**. This can be done in two ways:
  - `new React4xp(initParam);`, the basic constructor where `initParam` is either the XP component object, or an entry path string, or
  - `React4xp.buildFromParams(params)`, an all-in-one builder where `params` are the same as for `.renderSSR` and `.renderClient`, except for the `body` and `pageContributions` fields which aren't used here. 
  
This React4xp instance has the following methods:
  - `.setId(id)`: Sets the ID of the target container the component will be rendered into, or deletes it if omitted.
  - `.uniqueId()`: Makes sure the container ID is uinique, using a random postfix.
  - `.setJsxFileName(fileName)`: Adjusts the jsxPath by changing the file name. Useful for different-named jsx files when using the component shortcut.
  - `.setProps(props)`: Sets the component's top-level props.
  - `.renderClientPageContributions(pageContributions)`: Renders only the needed pageContributions for running the component on the client side. Includes dependency chunks, the component script, and the trigger. If a `pageContributions` argument is added, the rendered pageContributions are added to it, removing any duplicate scripts.
  - `.renderBody(body, content)`: Generates an HTML body string (or modifies it, if included as a `body` parameter) with a target container element with the ID of this component - into which the component will be rendered. If the component HTML already has been rendered (e.g. by `.renderToString`), add it as the `content` argument, and it will be inserted into the container.
  - `.renderToString(overrideProps)`: Renders a pure static HTML string of the react component, without a body / other surrounding HTML. If `overrideProps` is added, any props previously added to the instance are ignored.
  - `.renderIntoBody(body)`: Shorthand method, combining `renderToString` and `renderBody` for a full serverside HTML string rendering of the instance. 

The **examples** branch in this repo should have more on how to use this library in controllers.


### The service: `services/react4xp/react4xp.es6`

Used to fetch all compiled JS files - entries and dependency chunks - by entry path, i.e. the path of the compiled file below `build/resources/main/react4xp` (or `/react4xp/` in the JAR). Handles headers for efficient clientside HTTP caching, also caches everything to memory on the server for performance. 


### Nashorn server-side rendering

The serverside-oriented rendering methods in the library pass the compiled component by name (entry path / jsxPath) to some java code that loads and runs the component in Nashorn. The Nashorn engine is pre-polyfilled using some other pre-compiled code (see `src/main/react4xp/_nashornPolyfills_.es6`). 

Each specific component is stored in the nashorn engine by name on first access, as a function that takes props as argument. This way, the components are slow on the first rendering (around 1 second in the test cases) but much faster on repeated access, even with different props (2 - 30 ms).

Some other java code, HTMLInserter, is responsible for inserting HTML into other HTML. This is used for adding a container element to an existing body if it's missing a maching-ID target container, and to insert a rendered component into a target container in a preexisting body.

Errors on serverside are logged thoroughly for developers, and a minimal error message is returned as HTML for visible frontend output. When errors happen, the component in question is cleared from the engine's component cache.

Nashorn server-side rendering is recommended in the edit mode of XP content studio, to isolate away active scripts (which may interfere with the editing) while still keeping a visual representation of the component. The basic `.render` method selects this automatically.

#### Support, versions and polyfilling

While most react components so far seem to run fine, there may be some cases where the Nashorn engine will complain. If so, adapt your code, or add polyfilling to `src/main/react4xp/_nashornPolyfills_.es6`.

The JS support in Nashorn varies between different JVMs. Enonic XP 6 runs the java 8 JVM, while XP 7 will run java 11, which has better support - including ES6 natively. There may still be uncovered areas and unsupported functions, though.


## Other & misc.:

### Component-less entries

If a JSX file is found under `src/main/react4xp/_components` or below, it will keep that relative path and be compiled to an entry component. Good for component entries that shouldn't belong to a particular XP part/page. This approach is untested and not focused on, but should allow pure-app use. Files will be compiled to the `/react4xp/` root folder, and their entry names will be the file path under `_components`, i.e. without "_components" or "site" (or file extension) in the name.

### Controllable chunking

Add other subfolders under `src/main/react4xp/`: All other subfolders than _component under src/main/react4xp will be collected to chunks of their own, where the chunk name will be the same as the subfolder, plus a content hash. This includes both JSX and ES6 source files.

Note that source files that aren't imported by entries will not be compiled to the build folder. If you add source files right on the `src/main/react4xp/` root folder, they will be bundled into the entry file instead of a chunk - increasing the entry's size!

### Stateful class components

For rendering stateful class components, they must be wrapped during the export:

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

## More examples

See the examples branches.
