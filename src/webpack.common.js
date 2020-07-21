/**
 * Webpack common configuration.
 * it:
 * - Define the app entry point (./src) -> Where webpack will start compiling/bundling
 * - Define where assets will be served at by our webserver  (static/)
 * - Clean previous build on each build
 * - Generates the index.html file automatically by injecting bundled assets in it (css, js)
 * - Allow to load html files as strings in js code (i.e: import htmlString from './myHtmlFile.html)
 * - Allow to automatically generates the dependencies injection for angularJS components annotated with
 *   `'ngInject';` or `@ngInject` in comments. See https://docs.angularjs.org/guide/di
 */
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const hslPaths = require(path.join(__dirname, '../node_modules/hslayers-ng/common_paths'));

module.exports = {
  entry: { main: 'main.ts' },
  output: {
    // Path where bundled files will be output
    path: path.resolve(__dirname, '../static'),
    // Path at which output assets will be served
    publicPath: ''
  },
  // Just for build speed improvement
  resolve: { symlinks: true,
    extensions: ['.tsx', '.ts', '.js'],
    modules: [
      path.join(__dirname),
      path.join(__dirname, "../node_modules"),
      path.resolve(path.join(__dirname, "../node_modules", "hslayers-ng"))
    ].concat(hslPaths.paths)},
  plugins: [
    // Clean before build
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      // Path where the file will be generated (appended to output.path)
      filename: 'index.html',
      template: 'src/index.html',
      // We manually inject css and js files in our template
      inject: false
      // favicon: 'assets/img/favicon.ico'
    })
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          { loader: 'ng-annotate-loader' },
          { loader: 'ts-loader', options: { allowTsInNodeModules: true }},
        ],
        exclude: /node_modules\/(?!(hslayers-ng)\/).*/,
      },
      {
        // Mark files inside `@angular/core` as using SystemJS style dynamic imports.
        // Removing this will cause deprecation warnings to appear.
        test: /[\/\\]@angular[\/\\]core[\/\\].+\.js$/,
        parser: { system: true },  // enable SystemJS
      },
      // Automatically generates $inject array for angularJS components annotated with:
      // 'ngInject';
      // or commented with /**@ngInject */
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!(hslayers-ng)\/).*/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              // Babel syntax dynamic import plugin allow babel to correctly parse js files
              // using webpack dynamic import expression (i.e import('angular').then(...))
              plugins: ['angularjs-annotate', '@babel/plugin-syntax-dynamic-import']
            }
          }
        ]
      }
    ]
  }
};
