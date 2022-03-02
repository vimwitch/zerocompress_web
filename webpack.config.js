const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const { HtmlWebpackSkipAssetsPlugin } = require('html-webpack-skip-assets-plugin')

module.exports = {
  entry: ['./src/index.js'],
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: '/',
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
    alias: {
      react: require.resolve('react'),
      mobx: require.resolve('mobx'),
      'mobx-react-lite': require.resolve('mobx-react-lite'),
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader'
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        loader: 'file-loader',
        options: {
          // publicPath: 'build',
          esModule: false,
        }
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [{
          loader: MiniCssExtractPlugin.loader,
        }, 'css-loader',]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'assets/index.ejs',
      filename: 'index.html',
      inlineSource: '.(js)',
    }),
    new HtmlWebpackSkipAssetsPlugin({
      skipAssets: ['/styles.css'],
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    minimizer: [
      `...`,
      new CssMinimizerPlugin(),
    ],
  },
}
