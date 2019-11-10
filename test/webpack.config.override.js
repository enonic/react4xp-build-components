/* eslint-disable */
module.exports = function(env, config) {
  console.log(config);
  // Testing random expectations
  if (
    config.plugins[0].output !== "stats.components.json" ||
    config.externals["react-dom/server"] !== "ReactDOMServer" ||
    config.devtool !== false
  ) {
    console.log("---------------------- UNEXPECTED DATA:");
    console.log(JSON.stringify(config, null, 2));
    console.error(
      `config.plugins[0].output: ${JSON.stringify(
        config.plugins[0].output,
        null,
        2
      )}`
    );
    console.error(
      `config.externals['react-dom/server']: ${JSON.stringify(
        config.externals["react-dom/server"],
        null,
        2
      )}`
    );
    console.error(`config.devtool: ${JSON.stringify(config.devtool, null, 2)}`);
    throw Error("Random testing of expected default values failed.");
  }

  config.mode = "production";
  config.devtool = "cheap-module-eval-source-map";

  return config;
};
/* eslint-ensable */
