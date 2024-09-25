import path from "path";
import { fileURLToPath } from "url";
import CopyWebpackPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default () => {
  return {
    entry: "./src/index.ts", // Main entry point
    output: {
      filename: "index.js", // Always output as index.js (or use index.min.js if you prefer)
      path: path.resolve(__dirname, "dist"),
      library: {
        name: "CTFramework",
        type: "umd",
        export: "CTFramework",
      },
      globalObject: "this",
      clean: true, // Clean the output directory before each build
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/, // Handle both .ts and .tsx files
          use: "ts-loader", // Use ts-loader for TypeScript files
          exclude: /node_modules/, // Exclude node_modules directory
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"], // Support .tsx, .ts, and .js extensions
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: "src/jsx.d.ts", to: "jsx.d.ts" }, // Copy jsx.d.ts to dist
        ],
      }),
    ],
    devtool: "source-map", // Generate source maps for debugging
  };
};
