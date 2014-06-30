module.exports = {
  context: __dirname + "/src",
  entry: "./app.es6",
  output: {
    path: __dirname + "/public/js",
    filename: "app.js"
  },
  module: {
    loaders: [
      { test: /\.es6$/, loader: "regenerator" }
    ]
  }
};
