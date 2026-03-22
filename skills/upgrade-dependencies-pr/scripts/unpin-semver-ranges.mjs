#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const rootArg = process.argv[2];

if (!rootArg) {
  console.error("Usage: node unpin-semver-ranges.mjs <repo-root>");
  process.exit(1);
}

const rootDir = path.resolve(rootArg);
const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const skipDirs = new Set([
  ".git",
  ".hg",
  ".next",
  ".nuxt",
  ".pnpm-store",
  ".turbo",
  ".yarn",
  "coverage",
  "dist",
  "build",
  "node_modules",
  "out",
]);
const exactSemverPattern =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const preservePrefixes = [
  "^",
  "~",
  ">",
  "<",
  "=",
  "*",
  "workspace:",
  "file:",
  "link:",
  "portal:",
  "catalog:",
  "patch:",
  "git+",
  "github:",
  "http:",
  "https:",
  "npm:",
  "jsr:",
];
const preserveValues = new Set([
  "",
  "*",
  "latest",
  "next",
  "beta",
  "alpha",
  "canary",
  "rc",
]);

async function walk(dir, found = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (skipDirs.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walk(fullPath, found);
      continue;
    }

    if (entry.isFile() && entry.name === "package.json") {
      found.push(fullPath);
    }
  }

  return found;
}

function shouldPreserve(version) {
  if (preserveValues.has(version)) {
    return true;
  }

  return preservePrefixes.some((prefix) => version.startsWith(prefix));
}

function normalizeSection(section) {
  if (!section || typeof section !== "object" || Array.isArray(section)) {
    return { changed: false, updatedEntries: [] };
  }

  let changed = false;
  const updatedEntries = [];

  for (const [name, version] of Object.entries(section)) {
    if (typeof version !== "string") {
      continue;
    }

    if (shouldPreserve(version) || !exactSemverPattern.test(version)) {
      continue;
    }

    section[name] = `^${version}`;
    changed = true;
    updatedEntries.push(`${name}: ${version} -> ^${version}`);
  }

  return { changed, updatedEntries };
}

async function updatePackageJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  const updates = [];
  let changed = false;

  for (const sectionName of dependencySections) {
    const result = normalizeSection(parsed[sectionName]);
    if (!result.changed) {
      continue;
    }

    changed = true;
    updates.push(...result.updatedEntries.map((entry) => `${sectionName}.${entry}`));
  }

  if (!changed) {
    return null;
  }

  await fs.writeFile(filePath, `${JSON.stringify(parsed, null, 2)}\n`);
  return { filePath, updates };
}

const manifests = await walk(rootDir);
const results = [];

for (const manifestPath of manifests) {
  const result = await updatePackageJson(manifestPath);
  if (result) {
    results.push(result);
  }
}

if (results.length === 0) {
  console.log("No exact semver dependency ranges found.");
  process.exit(0);
}

for (const result of results) {
  console.log(result.filePath);
  for (const update of result.updates) {
    console.log(`  ${update}`);
  }
}
