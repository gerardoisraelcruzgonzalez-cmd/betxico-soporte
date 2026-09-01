import assert from "node:assert/strict";
import { publicAttachmentMetadata, validateSupportAttachments } from "../lib/attachment-policy.js";

const png = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex").toString("base64");
const [attachment] = validateSupportAttachments([{
  filename: "../INE cliente.exe",
  contentType: "image/png",
  dataBase64: png
}]);

assert.equal(attachment.filename, "INE cliente.png");
assert.equal(attachment.contentType, "image/png");
assert.equal(attachment.sizeBytes, 16);
assert.equal(publicAttachmentMetadata(attachment).dataBase64, undefined);

assert.throws(
  () => validateSupportAttachments([{ filename: "ine.jpg", contentType: "image/jpeg", dataBase64: png }]),
  (error) => error.message === "attachment_signature_mismatch" && error.statusCode === 400
);

assert.throws(
  () => validateSupportAttachments([{ filename: "archivo.svg", contentType: "image/svg+xml", dataBase64: png }]),
  (error) => error.message === "attachment_type_not_allowed"
);

assert.throws(
  () => validateSupportAttachments(Array.from({ length: 7 }, () => ({ contentType: "image/png", dataBase64: png }))),
  (error) => error.message === "too_many_attachments"
);

console.log("Attachment policy: 4 pruebas correctas.");
