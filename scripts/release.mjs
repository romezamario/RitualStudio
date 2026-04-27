#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");
const CHANGELOG_PATH = path.join(ROOT, "CHANGELOG.md");

const SIZE_TO_BUMP = {
  small: "patch",
  big: "minor",
  breaking: "major",
};

function parseArgs(argv) {
  const args = {};

  for (const token of argv) {
    if (!token.startsWith("--")) {
      continue;
    }

    const [rawKey, ...rest] = token.slice(2).split("=");
    const key = rawKey.trim();
    const value = rest.join("=").trim();
    args[key] = value;
  }

  return args;
}

function bumpVersion(version, bump) {
  const [majorRaw, minorRaw, patchRaw] = version.split(".");
  const major = Number(majorRaw);
  const minor = Number(minorRaw);
  const patch = Number(patchRaw);

  if ([major, minor, patch].some((part) => Number.isNaN(part))) {
    throw new Error(`La versión actual no tiene formato semver válido: ${version}`);
  }

  if (bump === "major") {
    return `${major + 1}.0.0`;
  }

  if (bump === "minor") {
    return `${major}.${minor + 1}.0`;
  }

  return `${major}.${minor}.${patch + 1}`;
}

function getTodayUtc() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function assertNotes(notes) {
  if (!notes) {
    throw new Error("Debes incluir notas con --notes='texto del cambio'.");
  }

  const lines = notes
    .split("|")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error("--notes no puede quedar vacío.");
  }

  return lines;
}

function ensureChangelogExists() {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    const header = [
      "# Bitácora de versiones",
      "",
      "Este archivo registra los cambios liberados por versión usando SemVer.",
      "",
      "## Convención de incrementos",
      "- `small` ⇒ `patch` (x.y.Z): ajustes pequeños, fixes y mejoras sin impacto funcional amplio.",
      "- `big` ⇒ `minor` (x.Y.0): cambios funcionales relevantes y nuevas capacidades compatibles.",
      "- `breaking` ⇒ `major` (X.0.0): cambios incompatibles que requieren adaptación.",
      "",
    ].join("\n");

    fs.writeFileSync(CHANGELOG_PATH, header, "utf8");
  }
}

function prependChangelogEntry(version, notes) {
  ensureChangelogExists();

  const current = fs.readFileSync(CHANGELOG_PATH, "utf8");
  const date = getTodayUtc();
  const entry = [
    `## v${version} - ${date}`,
    ...notes.map((note) => `- ${note}`),
    "",
  ].join("\n");

  const separator = current.endsWith("\n") ? "" : "\n";
  const updated = `${current}${separator}${entry}`;
  fs.writeFileSync(CHANGELOG_PATH, updated, "utf8");
}

function updatePackageVersion(nextVersion) {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
  packageJson.version = nextVersion;
  fs.writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const size = (args.size || "").toLowerCase();

  if (!size || !SIZE_TO_BUMP[size]) {
    throw new Error("Debes indicar --size=small|big|breaking.");
  }

  const bumpType = SIZE_TO_BUMP[size];
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
  const currentVersion = packageJson.version;
  const nextVersion = bumpVersion(currentVersion, bumpType);
  const notes = assertNotes(args.notes);

  updatePackageVersion(nextVersion);
  prependChangelogEntry(nextVersion, notes);

  console.log(`Versión actual: ${currentVersion}`);
  console.log(`Incremento aplicado: ${size} (${bumpType})`);
  console.log(`Nueva versión: ${nextVersion}`);
  console.log(`Bitácora actualizada: ${path.relative(ROOT, CHANGELOG_PATH)}`);
}

main();
