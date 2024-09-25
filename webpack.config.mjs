import path from "path";
import { fileURLToPath } from "url";
import CopyWebpackPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (_env, argv) => {
  const isProduction = argv.mode === "production";
  return {
    entry: "./src/index.ts", // Main entry point
    output: {
      filename: isProduction ? "index.min.js" : "index.js",
      path: path.resolve(__dirname, "dist"),
      library: {
        name: "CTFramework",
        type: "umd",
        export: "CTFramework",
      },
      globalObject: "this",
      clean: true,
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
    devtool: isProduction ? "source-map" : "inline-source-map", // Use source maps for debugging
  };
};
