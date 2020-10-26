/**
 * Webpack development configuration (merged with common one).
 * it overrides the webpack.common.js configuration and:
 * - Set mode to development -> This mode is used by some plugins and webpack to prevent minifying assets etc...
 * - Generates a sourcemap of bundled code -> Allow to easily debug js code (do not use in prod)
 * - Remove some bundling optimization to speed it up
 * - Allow Load css files (import './myCssFile.css') -> Css rules will be automatically added to index.html into a <style></style> tag.
 * - Allow to load fonts and images (import './myFont.eot'; import './someImage.jpg')
 */
const merge = require('webpack-merge');
const common = require('./webpack.common');
const path = require('path');
const webpack = require('webpack');
const env = process.env;
module.exports = merge(common, {
  mode: 'development',
  devtool: 'cheap-eval-source-map',
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  },
  resolve: {
    symlinks: true,
  },
  optimization: {
    // see https://webpack.js.org/guides/build-performance#avoid-extra-optimization-steps
    removeAvailableModules: false,
    removeEmptyChunks: false,
    // In dev mode we simply want to get a big bundle containing all our js
    splitChunks: false
  },
  output: {
    // see https://webpack.js.org/guides/build-performance#output-without-path-info
    pathinfo: false,
    filename: '[name].bundle.js'
  },
  devServer: {
    contentBase: [
      path.resolve(__dirname, "static"),
      path.resolve(__dirname, "node_modules")
    ],
    publicPath:  "/",
    hot: false,
    host: '0.0.0.0',
    liveReload: true,
    disableHostCheck: true,
    port: env.HTTP_PORT || 8082
  },
  module: {
    rules: [
      // Load css files which will be injected in html page at startup <style>...</style>)
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [{
          loader: 'url-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/'
          }
        }]
      },
      // Load angularJS partials HTML file as URL
      {
        test: /\.html$/,
        exclude: path.resolve(__dirname, './src/index.html'),
        use: [
          'html-loader',
        ]
      },
      // Load images as URLs
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: {
          loader: 'url-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'images'
          }
        }
      },
      // Load locales files
      {
        type: 'javascript/auto',
        test: /\.json$/,
        include: path.resolve(__dirname, 'assets/locales'),
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'locales'
            }
          }
        ]
      }
    ]
  }
})
