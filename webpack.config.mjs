import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
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
    devtool: isProduction ? "source-map" : "inline-source-map", // Use source maps for debugging
  };
};
