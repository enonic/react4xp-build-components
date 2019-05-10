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
const React4xpEntriesAndChunks = require('react4xp-build-entriesandchunks');
const StatsPlugin = require('stats-webpack-plugin');

module.exports = env => {
    env = env || {};

    const {
        SRC_R4X, R4X_ENTRY_SUBFOLDER, BUILD_R4X, BUILD_ENV, LIBRARY_NAME, EXTERNALS,
        COMPONENT_STATS_FILENAME, CHUNK_CONTENTHASH, ENTRIES_FILENAME,
        recommended
    } = require(env.REACT4XP_CONFIG_FILE);

    console.log({
        SRC_R4X, R4X_ENTRY_SUBFOLDER, BUILD_R4X, BUILD_ENV, LIBRARY_NAME, EXTERNALS,
        COMPONENT_STATS_FILENAME, CHUNK_CONTENTHASH, ENTRIES_FILENAME,
        recommended
    }, null, 2);//*/

    const DEVMODE = (BUILD_ENV !== 'production');

    const entries = React4xpEntriesAndChunks.getEntries(
        recommended.buildEntriesAndChunks.ENTRY_SETS,
        BUILD_R4X,
        ENTRIES_FILENAME,
        DEVMODE
    );
    console.log("\nentries: " + JSON.stringify(entries, null, 2));


    const cacheGroups = React4xpEntriesAndChunks.getCacheGroups(
        SRC_R4X,
        [R4X_ENTRY_SUBFOLDER],
        {sharedComps: 2},
        DEVMODE
    );
    console.log("\ncacheGroups: " + JSON.stringify(cacheGroups, null, 2));

    // Decides whether or not to hash filenames of common-component chunk files, and the length of the hash
    const chunkFileName = (!CHUNK_CONTENTHASH) ?
        "[name].js" :
        isNaN(CHUNK_CONTENTHASH) ?
            CHUNK_CONTENTHASH :
            `[name].[contenthash:${parseInt(CHUNK_CONTENTHASH)}].js`;

    return {
        mode: BUILD_ENV,

        entry: entries,

        output: {
            path: BUILD_R4X,                                // <-- Sets the base url for plugins and other target dirs. Note the use of {{assetUrl}} in index.html (or index.ejs).
            filename: "[name].js",                          // <-- Does not hash entry component filenames
            chunkFilename: chunkFileName,
            libraryTarget: 'var',
            library: [LIBRARY_NAME, '[name]'],
        },

        resolve: {
            extensions: ['.es6', '.js', '.jsx', '.less']
        },

        devtool: DEVMODE ? 'source-map' : false,

        module: {
            rules: [
                {
                    // Babel for building static assets
                    test: /\.((jsx?)|(es6))$/,
                    exclude: /[\\/]node_modules[\\/]/,
                    loader: 'babel-loader',
                    query: {
                        compact: !DEVMODE,
                        presets: ["react"]
                    },
                }, {
                    test: /\.less$/,
                    loaders: ["style-loader", "css-loader", "less-loader"]
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
            new StatsPlugin(COMPONENT_STATS_FILENAME,
                {
                    // Display the entry points with the corresponding bundles
                    entrypoints: true,                                          // <-- THE IMPORTANT ONE, FOR DEPENDENCY TRACKING!
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
                    version: false,
                }
            )
        ],
    };
};
