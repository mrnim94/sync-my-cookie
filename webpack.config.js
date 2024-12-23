const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
const sass = require('sass');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = [
  create('./src/popup.tsx'),
  create('./src/options.tsx'),
  create('./src/background.ts'),
];

function create(file) {
  const parsed = path.parse(file);
  const name = parsed.name;
  const ext = parsed.ext;
  const plugins = [
    // new BundleAnalyzerPlugin(),
  ];

  if (ext === '.tsx') {
    plugins.push(new HtmlWebpackPlugin({
      filename: `${name}.html`,
      inject: 'body',
      template: require('html-webpack-template'),
      appMountId: 'root',
      title: 'SyncMyCookie'
    }));
  }

  if (isProduction) {
    plugins.push(new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].chunk.css',
    }));
  }

  return {
    mode: isProduction ? 'production' : 'development',
    entry: file,
    output: {
      filename: `${name}.js`,
      path: path.resolve(__dirname, './build'),
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@ant-design/icons/lib/dist$': path.resolve(__dirname, './src/icons.ts'),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                experimentalWatchApi: true,
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.(scss|sass)$/,
          exclude: /\.module\.(scss|sass)$/,
          use: getStyleLoaders(
            {
              importLoaders: 3,
              sourceMap: !isProduction,
            },
            'sass-loader',
            {
              implementation: sass,
            }
          ),
        },
        {
          test: /\.module\.(scss|sass)$/,
          use: getStyleLoaders(
            {
              importLoaders: 3,
              sourceMap: !isProduction,
              modules: {
                localIdentName: '[name]__[local]__[hash:base64:5]',
              },
            },
            'sass-loader',
            {
              implementation: sass,
            }
          ),
        },
        {
          test: /.less$/,
          use: getStyleLoaders(
            {
              importLoaders: 2,
            },
            'less-loader',
            { javascriptEnabled: true },
          ),
        },
      ],
    },
    plugins,
  };
};

function getStyleLoaders(cssOptions, preProcessor, preProcessorOptions) {
  const loaders = [
    isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
    {
      loader: 'css-loader',
      options: cssOptions,
    },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: [
            'postcss-flexbugs-fixes',
            ['postcss-preset-env', {
              autoprefixer: {
                flexbox: 'no-2009',
              },
              stage: 3,
            }],
          ],
        },
      },
    },
  ];

  if (preProcessor) {
    loaders.push({
      loader: preProcessor,
      options: preProcessorOptions,
    });
  }

  return loaders;
};