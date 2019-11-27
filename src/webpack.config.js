/* eslint-disable no-console */
// Webpack for transpiling user-added JS, primarily react JSX components: top-level or shared components, component libraries.
// Looks mainy for JSX files in:
//
// - src/main/react4xp: Here, each file under /_entries/ will become a separate, top-level component/asset, and
// all other dependencies to those, in all other folders below react4xp, will be bundled into chunks by the name of
// the folder. Third-pardy dependencies in /node_modules/ will be separated out into a vendors bundle, except for externals,
// (based on config in <env.REACT4XP_CONFIG_FILE>, delivered by react-buildconstants and its config/overrides).
//
// All such second-level assets will have content-hashed file names for cache busting, hashes are stored for
// runtime reference in commonChunks.json.
//
// - ...and in the XP structure under src/main/resources/site: Here, JSX files are more tightly bound to their corresponding
// XP component (part, page, etc) but can still use the second-level dependency chunks mentioned above.
const React4xpEntriesAndChunks = require("react4xp-build-entriesandchunks");
const StatsPlugin = require("stats-webpack-plugin");
const path = require("path");
const fs = require("fs");

module.exports = (env = {}) => {
  const {
    SRC_R4X,
    R4X_ENTRY_SUBFOLDER,
    BUILD_R4X,
    BUILD_ENV,
    SRC_SITE,
    LIBRARY_NAME,
    EXTERNALS,
    COMPONENT_STATS_FILENAME,
    CHUNK_CONTENTHASH,
    ENTRIES_FILENAME
    // eslint-disable-next-line import/no-dynamic-require, global-require
  } = require(path.join(process.cwd(), env.REACT4XP_CONFIG_FILE));

  const DEVMODE = BUILD_ENV !== "production";
  const VERBOSE = `${env.VERBOSE || ""}`.trim().toLowerCase() === "true";

  // TODO: Probably more consistent if this too is a master config file property. Add to react4xp-buildconstants and import above from env.REACT4XP_CONFIG_FILE.
  let OVERRIDE_COMPONENT_WEBPACK = `${env.OVERRIDE_COMPONENT_WEBPACK ||
    ""}`.trim();
  let overrideCallback = (_, config) => config;
  if (OVERRIDE_COMPONENT_WEBPACK) {
    OVERRIDE_COMPONENT_WEBPACK = path.join(
      process.cwd(),
      OVERRIDE_COMPONENT_WEBPACK
    );

    // eslint-disable-next-line import/no-dynamic-require, global-require
    const overridden = require(OVERRIDE_COMPONENT_WEBPACK);

    if (typeof overridden === "object") {
      overrideCallback = () => overridden;
    } else if (typeof overridden === "function") {
      overrideCallback = overridden;
    } else {
      throw Error(
        `Optional overrideComponentWebpack (${OVERRIDE_COMPONENT_WEBPACK}) doesn't seem to default-export an object or a (env, config) => config function. Should either export a webpack-config-style object directly, OR take an env object and a webpack-config-type object 'config' as arguments, then manipulate or replace config, then return it.`
      );
    }
  }

  const chunkDirs = env.CHUNK_DIRS
    ? env.CHUNK_DIRS.trim()
        .replace(/[´`'"]/g, "")
        .split(",")
        .map(dir => path.join(SRC_R4X, dir.trim()))
        .filter(dir => {
          if (fs.existsSync(dir)) {
            if (!fs.lstatSync(dir).isDirectory()) {
              throw Error(
                `Can't add chunkDir: ${dir} was found but is not a directory. Probably check chunkDirs in react4xp.properties.`
              );
            }
            return true;
          }
          console.warn(
            `ChunkDir from react4xp.properties was not found. Skipping: ${dir}`
          );
          return false;
        })
    : [];

  const entryDirs = env.ENTRY_DIRS
    ? env.ENTRY_DIRS.trim()
        .replace(/[´`'"]/g, "")
        .split(",")
        .map(dir => path.join(SRC_R4X, dir.trim()))
        .filter(dir => {
          if (fs.existsSync(dir)) {
            if (!fs.lstatSync(dir).isDirectory()) {
              throw Error(
                `Can't add entryDir: ${dir} was found but is not a directory. Probably check entryDirs in react4xp.properties.`
              );
            }
            return true;
          }
          console.warn(
            `EntryDir from react4xp.properties was not found. Skipping: ${dir}`
          );
          return false;
        })
    : [];

  const entryExtensions = (env.ENTRY_EXT || "")
    .trim()
    .replace(/[´`'"]/g, "")
    .split(",")
    .map(ext => ext.trim())
    .map(ext => ext.replace(/^\./, ""))
    .filter(ext => !!ext);

  console.log(
    `chunkDirs (${
      Array.isArray(chunkDirs)
        ? `array[${chunkDirs.length}]`
        : typeof chunkDirs +
          (chunkDirs && typeof chunkDirs === "object"
            ? ` with keys: ${JSON.stringify(Object.keys(chunkDirs))}`
            : "")
    }): ${JSON.stringify(chunkDirs, null, 2)}`
  );

  console.log(
    `entryDirs (${
      Array.isArray(entryDirs)
        ? `array[${entryDirs.length}]`
        : typeof entryDirs +
          (entryDirs && typeof entryDirs === "object"
            ? ` with keys: ${JSON.stringify(Object.keys(entryDirs))}`
            : "")
    }): ${JSON.stringify(entryDirs, null, 2)}`
  );

  console.log(
    `entryExtensions (${
      Array.isArray(entryExtensions)
        ? `array[${entryExtensions.length}]`
        : typeof entryExtensions +
          (entryExtensions && typeof entryExtensions === "object"
            ? ` with keys: ${JSON.stringify(Object.keys(entryExtensions))}`
            : "")
    }): ${JSON.stringify(entryExtensions, null, 2)}`
  );

  const entrySets = [
    {
      sourcePath: SRC_SITE,
      sourceExtensions: ["jsx", "tsx"],
      targetSubDir: "site"
    },
    {
      sourcePath: path.join(
        process.cwd(),
        "node_modules",
        "react4xp-templates",
        "_entries"
      ),
      sourceExtensions: ["jsx", "tsx", "js", "ts", "es6", "es"]
    },
    ...entryDirs.map(entryDir => ({
      sourcePath: entryDir,
      sourceExtensions: entryExtensions
    }))
  ];

  const entries = React4xpEntriesAndChunks.getEntries(
    entrySets,
    BUILD_R4X,
    ENTRIES_FILENAME,
    VERBOSE
  );

  if (VERBOSE) {
    console.log(
      `\nentries (${
        Array.isArray(entries)
          ? `array[${entries.length}]`
          : typeof entries +
            (entries && typeof entries === "object"
              ? ` with keys: ${JSON.stringify(Object.keys(entries))}`
              : "")
      }): ${JSON.stringify(entries, null, 2)}`
    );
  }

  const cacheGroups = React4xpEntriesAndChunks.getCacheGroups(
    // TODO: Ditch the auto-by-folder chunking, get it from react4xp.properties: chunks
    // TODO: Allow chunks from outside of react4xp/ ?
    // TODO: All things imported under react4xp/ and NOT in entries or chunks: a single react4xp.<hash>.js chunk.

    SRC_R4X,
    [R4X_ENTRY_SUBFOLDER],
    { sharedComps: 2 },
    VERBOSE
  );

  if (VERBOSE) {
    console.log(`\ncacheGroups: ${JSON.stringify(cacheGroups, null, 2)}\n`);
  }

  // Decides whether or not to hash filenames of common-component chunk files, and the length of the hash
  let chunkFileName;

  if (!CHUNK_CONTENTHASH) {
    chunkFileName = "[name].js";
  } else if (typeof CHUNK_CONTENTHASH === "string") {
    chunkFileName = CHUNK_CONTENTHASH;
  } else {
    chunkFileName = `[name].[contenthash:${parseInt(
      CHUNK_CONTENTHASH,
      10
    )}].js`;
  }

  const config = {
    mode: BUILD_ENV,

    entry: entries,

    output: {
      path: BUILD_R4X, // <-- Sets the base url for plugins and other target dirs. Note the use of {{assetUrl}} in index.html (or index.ejs).
      filename: "[name].js", // <-- Does not hash entry component filenames
      chunkFilename: chunkFileName,
      libraryTarget: "var",
      library: [LIBRARY_NAME, "[name]"]
    },

    resolve: {
      extensions: [".es6", ".js", ".jsx"]
    },

    devtool: DEVMODE ? "source-map" : false,

    module: {
      rules: [
        {
          // Babel for building static assets. Excluding node_modules BUT ALLOWING node_modules/react4xp-templates
          test: /\.((jsx?)|(es6))$/,
          exclude: /(?=.*[\\/]node_modules[\\/](?!react4xp-templates))^(\w+)$/,
          loader: "babel-loader",
          query: {
            compact: !DEVMODE,
            presets: ["react"]
          }
        }
      ]
    },

    externals: EXTERNALS,

    optimization: {
      splitChunks: {
        name: false,
        cacheGroups
      }
    },

    plugins: [
      new StatsPlugin(COMPONENT_STATS_FILENAME, {
        // Display the entry points with the corresponding bundles
        entrypoints: true, // <-- THE IMPORTANT ONE, FOR DEPENDENCY TRACKING!
        errors: true,
        warnings: true,

        // Everything else switched off:
        assets: false,
        builtAt: false,
        cached: false,
        cachedAssets: false,
        children: false,
        chunks: false,
        chunkGroups: false,
        chunkModules: false,
        chunkOrigins: false,
        depth: false,
        env: false,
        errorDetails: false,
        hash: false,
        modules: false,
        moduleTrace: false,
        performance: false,
        providedExports: false,
        publicPath: false,
        reasons: false,
        source: false,
        timings: false,
        usedExports: false,
        version: false
      })
    ]
  };

  const outputConfig = overrideCallback(env, config);

  if (VERBOSE) {
    console.log(
      `\nreact4xp-buildcomponents: webpack config output${
        OVERRIDE_COMPONENT_WEBPACK
          ? ` (ADJUSTED BY ${OVERRIDE_COMPONENT_WEBPACK}): `
          : ": "
      }${JSON.stringify(outputConfig, null, 2)}\n`
    );
  }

  return outputConfig;
};
