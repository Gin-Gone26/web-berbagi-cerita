const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: './', // 👈 penting untuk GitHub Pages (relative path)
  },
  devServer: {
    static: './dist',
    historyApiFallback: true,
    port: 8080,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'], // 👈 ganti style-loader
      },
      { test: /\.(png|jpg|jpeg|gif|svg)$/i, type: 'asset/resource' },
      { test: /\.(woff|woff2|eot|ttf|otf)$/i, type: 'asset/resource' },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader', options: { presets: ['@babel/preset-env'] } },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
    new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' }), // 👈 generate file CSS
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/manifest.json', to: '' },
        { from: 'public/icon-192.png', to: '' },
        { from: 'public/icon-512.png', to: '' },
        { from: 'public/sw.js', to: '' },
        { from: 'public/idb.js', to: '' },
      ],
    }),
  ],
  resolve: { extensions: ['.js'] },
};
