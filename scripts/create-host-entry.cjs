const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const server = path.join(dist, "server");
fs.mkdirSync(server, { recursive: true });
const generatedEntry = path.join(server, "index.mjs");
if (fs.existsSync(generatedEntry)) fs.copyFileSync(generatedEntry, path.join(server, "index.js"));
fs.mkdirSync(path.join(dist, ".openai"), { recursive: true });
fs.copyFileSync(path.join(root, ".openai", "hosting.json"), path.join(dist, ".openai", "hosting.json"));
