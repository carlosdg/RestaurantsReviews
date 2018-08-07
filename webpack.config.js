const path = require("path");

const distFolderPath = path.resolve(__dirname, "./dist");

module.exports = {
  mode: process.env.MODE || "development",
  entry: {
    index: path.resolve(__dirname, "./src/js/index.js"),
    restaurant: path.resolve(__dirname, "./src/js/restaurant.js"),
    service_worker: path.resolve(__dirname, "./src/service_worker.js")
  },
  output: {
    filename: "[name].js",
    path: distFolderPath
  }
};