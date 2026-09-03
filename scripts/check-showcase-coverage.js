import * as CTFramework from "../src/Index.js";
import { ShowcaseApiCoverage } from "../tests/browser/showcase/ApiCoverage.js";

const publicExports = Object.keys(CTFramework)
  .filter((name) => name !== "default")
  .sort();
const coveredExports = ShowcaseApiCoverage.slice().sort();
const missingExports = publicExports.filter((name) => !coveredExports.includes(name));
const staleCoverage = coveredExports.filter((name) => !publicExports.includes(name));

if (missingExports.length || staleCoverage.length) {
  if (missingExports.length) {
    console.error(`Showcase coverage is missing: ${missingExports.join(", ")}`);
  }

  if (staleCoverage.length) {
    console.error(`Showcase coverage is stale: ${staleCoverage.join(", ")}`);
  }

  process.exitCode = 1;
} else {
  console.log("CTFramework showcase covers every public export.");
}
