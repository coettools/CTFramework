const fs = require("fs");
const path = require("path");

// Path to the generated index.d.ts file
const distPath = path.resolve(__dirname, "dist", "index.d.ts");

// Reference path to add
const referencePath = '/// <reference path="./jsx.d.ts" />\n';

// Read the contents of the index.d.ts file
fs.readFile(distPath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading index.d.ts file:", err);
    return;
  }

  // Check if the reference already exists
  if (!data.includes(referencePath)) {
    // Append the reference path at the top
    const updatedData = referencePath + data;

    // Write the updated data back to the index.d.ts file
    fs.writeFile(distPath, updatedData, "utf8", (writeErr) => {
      if (writeErr) {
        console.error("Error writing to index.d.ts file:", writeErr);
        return;
      }
      console.log("Successfully added reference path to index.d.ts");
    });
  } else {
    console.log("Reference path already exists in index.d.ts");
  }
});
