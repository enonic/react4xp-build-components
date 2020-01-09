module.exports = function(env, _config) {
  // This makes 'npm link' symlinks in node_modules work:
  const config = { ..._config };
  config.resolve.symlinks = false;
  return config;
};
