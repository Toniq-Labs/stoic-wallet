const webpack = require('webpack');
module.exports = {
  webpack: {
    configure: (config) => {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        crypto: require.resolve('crypto-browserify'), stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'), vm: require.resolve('vm-browserify'),
        assert: require.resolve('assert/'), http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'), os: require.resolve('os-browserify/browser'),
        url: require.resolve('url/'), path: require.resolve('path-browserify'),
        util: require.resolve('util/'), zlib: require.resolve('browserify-zlib'),
        process: require.resolve('process/browser'), querystring: require.resolve('querystring-es3'),
        fs: false, net: false, tls: false, child_process: false, dns: false,
        http2: false, module: false, perf_hooks: false, worker_threads: false, readline: false,
      };
      config.plugins.push(new webpack.ProvidePlugin({Buffer: ['buffer', 'Buffer'], process: 'process/browser'}));
      config.ignoreWarnings = [/Failed to parse source map/];
      return config;
    },
  },
};
