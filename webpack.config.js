// webpack v4
const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, options) => {

    const devMode = options.mode === 'development' ? true : false;

    return {
        entry: './src/index.js',
        devtool: "source-map",
        watch: true,
        output: {
            filename: 'bundle.[hash].js'
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader", "postcss-loader"]
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader"
                    }
                },
                {
                    test: /\.s?[ac]ss$/,
                    use: [
                        devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                        {
                            loader: "css-loader", options: {
                                sourceMap: true
                            }
                        }, {
                            loader: "sass-loader", options: {
                                sourceMap: true
                            }
                        }
                    ]
                },
                { test: /\.woff$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
                { test: /\.ttf$/, loader: "url-loader?limit=10000&mimetype=application/octet-stream" },
                { test: /\.eot$/, loader: "file-loader" },
                { test: /\.svg$/, loader: "url-loader?limit=10000&mimetype=image/svg+xml" },
                { test: /\.(png|jpg|gif)$/, loader: "file-loader" },
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: devMode ? '[name].css' : '[name].[hash].css',
                chunkFilename: devMode ? '[id].css' : '[id].[hash].css',
            }),
            new HtmlWebpackPlugin({
                template: './src/index.template.html',
                filename: 'index.html'
            }),
            new CopyWebpackPlugin([
                { from: 'js', to: 'js' }
            ])
        ]
    }

};
