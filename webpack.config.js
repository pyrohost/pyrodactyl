const path = require('path');
const webpack = require('webpack');
const AssetsManifestPlugin = require('webpack-assets-manifest');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require('terser-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const typeChecking = process.env.TYPE_CHECKING !== 'false';

module.exports = {
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
        fallback: {
            fs: require.resolve('fs'),
            os: require.resolve('os-browserify/browser'),
            path: require.resolve('path-browserify'),
        },
    },
    cache: true,
    target: 'web',
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : process.env.DEVTOOL || 'eval-source-map',
    performance: {
        hints: false,
    },
    entry: ['./resources/scripts/index.tsx'],
    output: {
        path: path.join(__dirname, '/public/assets'),
        filename: '[name].js',
        chunkFilename: '[id].[chunkhash].js',
        publicPath: process.env.WEBPACK_PUBLIC_PATH || '/assets/',
        crossOriginLoading: 'anonymous',
        pathinfo: false,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules|\.spec\.tsx?$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                    },
                },
            },
            // Doesn't work sadly cause our packages need to be polyfilled
            // and webpack doesn't feel like doing that ???
            // {
            //     // Match `.js`, `.jsx`, `.ts` or `.tsx` files
            //     test: /\.[jt]sx?$/,
            //     exclude: /node_modules|\.spec\.tsx?$/,
            //     loader: 'esbuild-loader',
            //     options: {
            //         // JavaScript version to compile to
            //         target: 'es2015',
            //     },
            // },

            // Why do we need to transpile node_modules? Removing this doesn't
            // break builds for me, but I'll keep it just in case. Should be
            // faster with swc
            {
                test: /\.mjs$/,
                include: /node_modules/,
                type: 'javascript/auto',
                // fails on production, works on dev
                // use: {
                //     loader: 'swc-loader',
                //     options: {
                //         parseMap: true,
                //     },
                // },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader', 'postcss-loader'], // Simplified CSS loader configuration
            },
            {
                test: /\.(png|jp(e?)g|gif)$/,
                loader: 'file-loader',
                options: {
                    name: 'images/[name].[hash:8].[ext]',
                },
            },
            {
                test: /\.svg$/,
                loader: 'svg-url-loader',
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
        alias: {
            '@': path.join(__dirname, '/resources/scripts'),
            '@definitions': path.join(__dirname, '/resources/scripts/api/definitions'),
            '@feature': path.join(__dirname, '/resources/scripts/components/server/features'),
        },
        symlinks: false,
    },
    externals: {
        moment: 'moment',
    },
    plugins: [
        new webpack.EnvironmentPlugin({
            NODE_ENV: isProduction ? 'production' : 'development',
            DEBUG: isProduction ? 'false' : 'true',
            WEBPACK_BUILD_HASH: Date.now().toString(16),
        }),

        new AssetsManifestPlugin({ writeToDisk: true, publicPath: true, integrity: true, integrityHashes: ['sha384'] }),

        typeChecking
            ? new ForkTsCheckerWebpackPlugin({
                  typescript: {
                      mode: 'write-references',
                      diagnosticOptions: {
                          semantic: true,
                          syntactic: true,
                      },
                  },
                  eslint: {
                      files: `${path.join(__dirname, '/resources/scripts')}/**/*.{ts,tsx}`,
                  },
              })
            : null,

        process.env.ANALYZE_BUNDLE
            ? new BundleAnalyzerPlugin({
                  analyzerHost: '0.0.0.0',
                  analyzerPort: 8081,
              })
            : null,
    ].filter((p) => p),
    optimization: {
        usedExports: isProduction,
        sideEffects: isProduction,
        removeEmptyChunks: isProduction,
        mergeDuplicateChunks: isProduction,
        providedExports: isProduction,
        concatenateModules: isProduction,
        minimize: isProduction,
        runtimeChunk: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    compress: {
                        drop_console: true,
                    },
                },
            }),
        ],
    },
    watchOptions: {
        poll: 1000,
        ignored: /node_modules/,
    },
    devServer: {
        hot: true,
        port: 3000,
        compress: true,
        contentBase: path.join(__dirname, '/public'),
        publicPath: process.env.WEBPACK_PUBLIC_PATH || '/assets/',
        allowedHosts: ['.pterodactyl.test'],
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    },
};
