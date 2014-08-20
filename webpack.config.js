module.exports = {
  context: __dirname + "/src",
  entry: [ "regenerator/runtime/dev", "./client.es6.js" ],
  output: {
    path: __dirname + "/public/js",
    filename: "app.js"
  },
  module: {
    loaders: [
      { test: /\.es6\.js$/, loader: "regenerator" }
    ]
  },
  resolve: {
    extensions: [ "", ".js", ".es6.js" ]
  }
};
