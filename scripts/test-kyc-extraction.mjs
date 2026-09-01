import assert from "node:assert/strict";
import { exactKycEmail, normalizeKycUserRecord, normalizeKycVerificationRecord, selectKycDocuments } from "../lib/kyc-extraction.js";

assert.equal(exactKycEmail(" Cliente@Example.com ", "cliente@example.com"), true);
assert.equal(exactKycEmail("otro@example.com", "cliente@example.com"), false);

const selected = selectKycDocuments([
  { type: "id_ine_front", url: "https://docs.example.test/front-old.jpg", status: "processed", uploadedAt: "2026-08-10T10:00:00Z" },
  { type: "id_ine_front", url: "https://docs.example.test/front-new.jpg", status: "processed", uploadedAt: "2026-08-12T10:00:00Z" },
  { type: "id_ine_back", url: "https://docs.example.test/back.jpg", status: "processed", uploadedAt: "2026-08-12T10:01:00Z" },
  { type: "selfie", url: "https://docs.example.test/selfie.jpg", status: "processed", uploadedAt: "2026-08-12T10:02:00Z" }
]);
assert.equal(selected.ineFront.url, "https://docs.example.test/front-new.jpg");
assert.equal(selected.ineBack.url, "https://docs.example.test/back.jpg");
assert.equal(selected.selfie.url, "https://docs.example.test/selfie.jpg");

const user = normalizeKycUserRecord({
  user: {
    id: "user-1",
    kyc_verification_id: "verification-1",
    first_name: "Maria",
    apellido_paterno: "Lopez",
    apellido_materno: "Diaz",
    email: "maria@example.com",
    phone: "5500000000",
    date_of_birth: "1990-01-02",
    curp: "LODM900102MDFPZR01",
    profession: "Contadora",
    document_type: "INE / IFE",
    document_number: "DOC-123",
    kyc_status: "approved",
    id_document_verified: true
  },
  documents: Object.values(selected),
  verification: { verification: { sexo: "M", liveness_score: 98 } }
});
assert.equal(user.source, "users");
assert.equal(user.personal.paternalSurname, "Lopez");
assert.equal(user.personal.sex, "M");
assert.equal(user.personal.documentNumber, "DOC-123");
assert.equal(user.profileUrl.endsWith("/dashboard/users/user-1"), true);

const verification = normalizeKycVerificationRecord({
  id: "verification-2",
  first_name: "Maria",
  apellido_paterno: "Lopez",
  apellido_materno: "Diaz",
  email: "maria@example.com",
  phone: "5500000000",
  fecha_nacimiento: "1990-01-02",
  curp: "LODM900102MDFPZR01",
  sexo: "M",
  occupation: "Contadora",
  ocr_identificador: "OCR-456",
  status: "needs_review",
  selfie_url: "https://docs.example.test/selfie-2.jpg",
  id_front_url: "https://docs.example.test/front-2.jpg",
  id_back_url: "https://docs.example.test/back-2.jpg",
  has_duplicates: true
});
assert.equal(verification.source, "verifications");
assert.equal(verification.personal.documentType, "INE / IFE");
assert.equal(verification.personal.documentNumber, "OCR-456");
assert.equal(verification.documents.ineBack.url, "https://docs.example.test/back-2.jpg");
assert.equal(verification.checks.hasDuplicates, true);

console.log("KYC extraction contracts passed.");
