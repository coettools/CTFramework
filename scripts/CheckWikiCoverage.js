import * as CTFramework from "../src/Index.js";
import { WikiApiCoverage } from "../../wiki.ct-framework/ApiCoverage.mjs";

const publicExports = Object.keys(CTFramework)
  .filter((name) => name !== "default")
  .sort();
const coveredExports = WikiApiCoverage.slice().sort();
const missingExports = publicExports.filter((name) => !coveredExports.includes(name));
const staleCoverage = coveredExports.filter((name) => !publicExports.includes(name));

if (missingExports.length || staleCoverage.length) {
  if (missingExports.length) {
    console.error(`Wiki coverage is missing: ${missingExports.join(", ")}`);
  }

  if (staleCoverage.length) {
    console.error(`Wiki coverage is stale: ${staleCoverage.join(", ")}`);
  }

  process.exitCode = 1;
} else {
  console.log("CTFramework wiki covers every public export.");
}
