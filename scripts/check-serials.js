#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function walk(dir, cb) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) return walk(full, cb);
    cb(full);
  });
}

const root = path.join(__dirname, "..", "src");
const matches = [];
walk(root, (file) => {
  if (
    !file.endsWith(".js") &&
    !file.endsWith(".cjs") &&
    !file.endsWith(".ts") &&
    !file.endsWith(".tsx") &&
    !file.endsWith(".sql") &&
    !file.endsWith(".d.ts")
  )
    return;
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("serial_number")) matches.push(file);
});

if (matches.length) {
  console.log("References to serial_number found in:");
  matches.forEach((m) => console.log(" -", m));
  process.exit(1);
} else {
  console.log("No serial_number references found in src files.");
  process.exit(0);
}
