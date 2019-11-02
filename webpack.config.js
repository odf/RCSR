module.exports = {
  context: __dirname + "/src",
  entry: [ "regenerator/runtime/dev", "./client.js" ],
  output: {
    path: __dirname + "/content/public/js",
    filename: "app.js"
  },
  module: {
    rules: [
      { test: /\.es6\.js$/, use: "regenerator" },
      { test: /\.json$/, use: "json" }
    ]
  },
  resolve: {
    extensions: [ ".js", ".es6.js" ]
  }
};
