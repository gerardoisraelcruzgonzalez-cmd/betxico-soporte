import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const env = loadEnv(".env.local");
const apiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY;
const existingVectorStoreId = process.env.OPENAI_VECTOR_STORE_ID || env.OPENAI_VECTOR_STORE_ID || "";
const knowledgePath = resolve(process.argv[2] || "docs/betxico-soporte-knowledge.md");

if (!apiKey) {
  console.error("Missing OPENAI_API_KEY.");
  process.exit(1);
}
if (!existsSync(knowledgePath)) {
  console.error(`Missing knowledge file: ${knowledgePath}`);
  process.exit(1);
}

const vectorStoreId = existingVectorStoreId || await createVectorStore(apiKey);
const fileId = await uploadFile(apiKey, knowledgePath);
await attachFile(apiKey, vectorStoreId, fileId);
writeEnvValue(".env.local", "OPENAI_VECTOR_STORE_ID", vectorStoreId);
writeEnvValue(".env.vercel.local", "OPENAI_VECTOR_STORE_ID", vectorStoreId);

console.log(`OPENAI_VECTOR_STORE_ID=${vectorStoreId}`);
console.log(`Uploaded file ${fileId} from ${knowledgePath}.`);

async function createVectorStore(key) {
  const response = await fetch("https://api.openai.com/v1/vector_stores", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ name: "Betxico Soporte Knowledge" })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || "vector_store_create_failed");
  }
  return data.id;
}

async function uploadFile(key, filename) {
  const form = new FormData();
  const bytes = readFileSync(filename);
  form.append("purpose", "assistants");
  form.append("file", new File([bytes], filename.split("/").pop(), { type: "text/markdown" }));

  const response = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: { authorization: `Bearer ${key}` },
    body: form
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || "file_upload_failed");
  }
  return data.id;
}

async function attachFile(key, vectorStoreId, fileId) {
  const response = await fetch(`https://api.openai.com/v1/vector_stores/${encodeURIComponent(vectorStoreId)}/files`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ file_id: fileId })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || "vector_store_attach_failed");
  }
}

function loadEnv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }));
}

function writeEnvValue(file, key, value) {
  let content = existsSync(file) ? readFileSync(file, "utf8") : "";
  const line = `${key}=${value}`;
  if (new RegExp(`^${key}=.*$`, "m").test(content)) {
    content = content.replace(new RegExp(`^${key}=.*$`, "m"), line);
  } else {
    content = `${content.replace(/\s*$/, "")}\n${line}\n`;
  }
  writeFileSync(file, content);
}
