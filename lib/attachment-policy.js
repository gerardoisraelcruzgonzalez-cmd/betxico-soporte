import crypto from "node:crypto";

export const MAX_ATTACHMENT_COUNT = 6;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024;

const ALLOWED_TYPES = new Map([
  ["image/jpeg", { extension: ".jpg", matches: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }],
  ["image/png", { extension: ".png", matches: (bytes) => bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) }],
  ["image/webp", { extension: ".webp", matches: (bytes) => bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP" }],
  ["application/pdf", { extension: ".pdf", matches: (bytes) => bytes.subarray(0, 5).toString("ascii") === "%PDF-" }]
]);

export function validateSupportAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];
  if (attachments.length > MAX_ATTACHMENT_COUNT) {
    throwAttachmentError("too_many_attachments");
  }

  let totalBytes = 0;
  const validated = attachments.map((attachment, index) => {
    const contentType = String(attachment?.contentType || attachment?.type || "").trim().toLowerCase();
    const policy = ALLOWED_TYPES.get(contentType);
    if (!policy) throwAttachmentError("attachment_type_not_allowed", { index, contentType });

    const dataBase64 = normalizeBase64(attachment?.dataBase64, index);
    const bytes = Buffer.from(dataBase64, "base64");
    if (!bytes.length) throwAttachmentError("attachment_empty", { index });
    if (bytes.length > MAX_ATTACHMENT_BYTES) throwAttachmentError("attachment_too_large", { index, sizeBytes: bytes.length });
    if (!policy.matches(bytes)) throwAttachmentError("attachment_signature_mismatch", { index, contentType });

    totalBytes += bytes.length;
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      throwAttachmentError("attachments_total_too_large", { sizeBytes: totalBytes });
    }

    return {
      filename: safeFilename(attachment?.filename || attachment?.name, index, policy.extension),
      contentType,
      dataBase64,
      sizeBytes: bytes.length,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex")
    };
  });

  return validated;
}

export function publicAttachmentMetadata(attachment = {}) {
  return {
    filename: String(attachment.filename || "adjunto").slice(0, 120),
    contentType: String(attachment.contentType || "application/octet-stream").slice(0, 100),
    sizeBytes: Number(attachment.sizeBytes || 0),
    sha256: String(attachment.sha256 || "").slice(0, 64)
  };
}

function normalizeBase64(value, index) {
  const raw = String(value || "").trim().replace(/^data:[^;]+;base64,/i, "").replace(/\s+/g, "");
  if (!raw || raw.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(raw)) {
    throwAttachmentError("attachment_invalid_base64", { index });
  }
  const bytes = Buffer.from(raw, "base64");
  const canonical = bytes.toString("base64").replace(/=+$/, "");
  if (canonical !== raw.replace(/=+$/, "")) {
    throwAttachmentError("attachment_invalid_base64", { index });
  }
  return bytes.toString("base64");
}

function safeFilename(value, index, extension) {
  const raw = String(value || `adjunto-${index + 1}${extension}`).trim();
  const base = raw.split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 100) || `adjunto-${index + 1}`;
  const withoutExtension = base.replace(/\.[^.]+$/, "").replace(/[. ]+$/, "") || `adjunto-${index + 1}`;
  return `${withoutExtension}${extension}`;
}

function throwAttachmentError(message, details = {}) {
  const error = new Error(message);
  error.statusCode = 400;
  error.details = details;
  throw error;
}
