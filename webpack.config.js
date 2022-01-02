const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/visor'),
  },
  watch: true,

  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif|bin|webm|fs|vs)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'static',
              useRelativePath: true
            }
          }
        ]
      },
      {
        test: /\.(eot|ttf|woff)$/i,
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
    ],
  },
};
