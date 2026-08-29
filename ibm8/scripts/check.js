const { readdirSync, statSync } = require("node:fs");
const { join, relative } = require("node:path");
const { spawnSync } = require("node:child_process");

const root = join(__dirname, "..");
const files = [join(root, "server.js")];

function collectJavaScript(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      collectJavaScript(path);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(path);
    }
  }
}

for (const directory of ["src", "client", "tests"]) {
  const path = join(root, directory);
  if (statSync(path).isDirectory()) {
    collectJavaScript(path);
  }
}

let failed = false;
for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log(`Syntax checked ${files.length} JavaScript files.`);
}
