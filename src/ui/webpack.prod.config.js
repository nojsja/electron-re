const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

// 拆分样式文件
const extractLess = new ExtractTextPlugin({
  filename: 'style.less.css',
});

const extractCss = new ExtractTextPlugin({
  filename: 'style.css',
});

// 拆分静态库
const dllRefPlugin = new webpack.DllReferencePlugin({
  context: __dirname,
  manifest: require(path.resolve('dist/vendor-manifest.json')),
});

module.exports = {
  entry: [
    './index',
  ],
  mode: 'production',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  resolve: {
    extensions: [".js", ".jsx", ".es6", ".tsx", ".ts"],
    alias: {
      resources: path.resolve(__dirname, 'resources'),
      app: path.resolve(__dirname, 'app'),
      utils: path.resolve(__dirname, 'app/utils'),
      components: path.resolve(__dirname, 'app/components'),
      router: path.resolve(__dirname, 'app/router'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loaders: ['babel-loader', 'ts-loader']
      },
      {
        test: /\.m?js|\.jsx$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
            ],
            plugins: [
              ["@babel/plugin-proposal-decorators", { "legacy": true }],
              ["@babel/plugin-proposal-class-properties", {"loose": true}],
              "@babel/plugin-proposal-function-sent",
              "@babel/plugin-proposal-export-namespace-from",
              "@babel/plugin-proposal-numeric-separator",
              "@babel/plugin-proposal-throw-expressions"
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: extractCss.extract({
          fallback: 'style-loader',
          use: 'css-loader',
          publicPath: path.join(__dirname, 'dist/'),
        }),
      },
      {
        test: /\.less$/,
        use: extractLess.extract({
          use: [{
            loader: 'css-loader',
          }, {
            loader: 'less-loader',
          }],
          fallback: 'style-loader', // 在开发环境使用 style-loader
          publicPath: path.join(__dirname, 'dist/'),
        }),
      },
      {
        test: /\.html$/,
        use: {
          loader: 'html-loader',
        },
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|ico|woff|eot|ttf|woff2|icns)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
            },
          },
        ],
      },
    ],
  },

  plugins: [
    dllRefPlugin,
    extractCss,
    extractLess,
    new webpack.NamedModulesPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({ template: 'index.html', inject: false }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
  ],
  target: 'electron-renderer',
};
