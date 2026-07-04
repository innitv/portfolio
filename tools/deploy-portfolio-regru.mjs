import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(repoRoot, "dist");
const envPath = path.resolve(repoRoot, process.env.PORTFOLIO_DEPLOY_ENV ?? ".env.portfolio-deploy");

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Deploy env file was not found: ${filePath}`);
  }

  const entries = {};
  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function collectFiles(dir, baseDir = dir) {
  const files = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath, baseDir));
      continue;
    }

    if (stat.isFile()) {
      files.push({
        absolutePath: fullPath,
        relativePath: path.relative(baseDir, fullPath).replaceAll(path.sep, "/"),
      });
    }
  }

  return files;
}

function normalizeRemoteDir(remoteDir) {
  const trimmed = (remoteDir || "/").trim();
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

function encodeRemotePath(remotePath) {
  return remotePath
    .split("/")
    .map((segment, index) => {
      if (index === 0) {
        return segment;
      }

      return encodeURIComponent(segment);
    })
    .join("/");
}

function runCurl(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("curl", args, {
      cwd: repoRoot,
      stdio: "inherit",
      windowsHide: true,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`curl exited with code ${code}`));
      }
    });
  });
}

const env = parseEnvFile(envPath);
const host = env.PORTFOLIO_FTP_HOST;
const user = env.PORTFOLIO_FTP_USER;
const password = env.PORTFOLIO_FTP_PASSWORD;
const remoteDir = normalizeRemoteDir(env.PORTFOLIO_FTP_REMOTE_DIR);
const protocol = env.PORTFOLIO_FTP_PROTOCOL || "ftp";
const port = env.PORTFOLIO_FTP_PORT ? `:${env.PORTFOLIO_FTP_PORT}` : "";
const dryRun = process.argv.includes("--dry-run");

const missing = [
  ["PORTFOLIO_FTP_HOST", host],
  ["PORTFOLIO_FTP_USER", user],
  ["PORTFOLIO_FTP_PASSWORD", password],
].filter(([, value]) => !value);

if (missing.length > 0) {
  throw new Error(`Missing deploy env keys: ${missing.map(([key]) => key).join(", ")}`);
}

if (!existsSync(distDir)) {
  throw new Error(`Portfolio build directory does not exist: ${distDir}. Run yarn build first.`);
}

const files = collectFiles(distDir).sort((a, b) => a.relativePath.localeCompare(b.relativePath));

if (files.length === 0) {
  throw new Error(`Portfolio build directory is empty: ${distDir}`);
}

console.log(`[deploy:portfolio] Uploading ${files.length} files to ${protocol}://${host}${port}${remoteDir}/`);

for (const file of files) {
  const remotePath = encodeRemotePath(`${remoteDir}/${file.relativePath}`);
  const remoteUrl = `${protocol}://${host}${port}${remotePath}`;
  const args = [
    "--fail",
    "--show-error",
    "--ftp-create-dirs",
    "--user",
    `${user}:${password}`,
    "--upload-file",
    file.absolutePath,
    remoteUrl,
  ];

  if (protocol === "ftps") {
    args.unshift("--ssl-reqd");
  }

  console.log(`[deploy:portfolio] ${dryRun ? "Would upload" : "Uploading"} ${file.relativePath}`);

  if (!dryRun) {
    await runCurl(args);
  }
}

console.log("[deploy:portfolio] Done.");
