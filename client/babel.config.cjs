// Used only by Jest (via babel-jest) to transform ESM test files + the modules
// they import for Node. Vite handles its own transforms for the app build and
// does not read this file.
module.exports = {
  presets: [["@babel/preset-env", { targets: { node: "current" } }]],
};
