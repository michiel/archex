const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    main3d: "./src/index.js",
    main2d: "./src/index2d.js",
    mainradial: "./src/index-d3-radial.js",
  },
  output: {
    path: path.resolve(__dirname, 'dist')
  }
};
