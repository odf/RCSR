module.exports = {
  context: __dirname + "/src",
  entry: [ "regenerator/runtime/dev", "./client.js" ],
  output: {
    path: __dirname + "/content/public/js",
    filename: "app.js"
  },
  module: {
    loaders: [
      { test: /\.es6\.js$/, loader: "regenerator" },
      { test: /\.json$/, loader: "json" }
    ]
  },
  resolve: {
    extensions: [ "", ".js", ".es6.js" ]
  }
};
