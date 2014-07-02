module.exports = {
  context: __dirname + "/src",
  entry: [ "regenerator/runtime/dev", "./app.es6" ],
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
