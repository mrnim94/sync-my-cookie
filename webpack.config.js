const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
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
      template: path.resolve(__dirname, './template.html'),
      title: 'SyncMyCookie',
      chunks: [name],
    }));
  }
  if (isProduction) {
    plugins.push(new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].chunk.css',
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
            { loader: 'babel-loader' },
          ]
        },
        {
          test: /\.(scss|sass)$/,
          exclude: /\.module\.(scss|sass)$/,
          use: getStyleLoaders(
            {
              importLoaders: 2,
            },
            'sass-loader'
          ),
        },
        {
          test: /\.module\.(scss|sass)$/,
          use: getStyleLoaders(
            {
              importLoaders: 2,
              modules: {
                localIdentName: '[name]__[local]__[hash:base64:5]',
              },
            },
            'sass-loader'
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
    isProduction ? { loader: MiniCssExtractPlugin.loader } : 'style-loader',
    {
      loader: 'css-loader',
      options: cssOptions,
    },
    {
      // Options for PostCSS as we reference these options twice
      // Adds vendor prefixing based on your specified browser support in
      // package.json
      loader: 'postcss-loader',
      options: {
        // Necessary for external CSS imports to work
        // https://github.com/facebook/create-react-app/issues/2677
        postcssOptions: {
          plugins: [
            'postcss-flexbugs-fixes',
            [
              'postcss-preset-env',
              {
                autoprefixer: {
                  flexbox: 'no-2009',
                },
                stage: 3,
              },
            ],
          ],
        },
        sourceMap: !isProduction,
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
