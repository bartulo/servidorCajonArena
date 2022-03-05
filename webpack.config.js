const path = require('path');

module.exports = {
  entry: {
    app: './src/index.js',
    formulario: './src/formulario.js',
    main: './src/main.js',
  },
  output: {
    filename: 'javascripts/[name].bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  watch: true,

  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif|bin|webm|fs|vs)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'images',
              useRelativePath: true
            }
          }
        ]
      },
      {
        test: /\.(eot|ttf|woff|svg)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ]
      },
      {
        test: /\.glsl$/,
        loader: 'webpack-glsl-loader'
      },
    ],
  },
};
