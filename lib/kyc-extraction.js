const DOCUMENT_SLOTS = {
  selfie: ["selfie"],
  ineFront: ["id_ine_front", "ine_front", "id_front"],
  ineBack: ["id_ine_back", "ine_back", "id_back"]
};

export function cleanKycText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function exactKycEmail(value, email) {
  return cleanKycText(value).toLowerCase() === cleanKycText(email).toLowerCase();
}

export function normalizeKycUserRecord({ user = {}, documents = [], verification = {} } = {}) {
  const linkedVerification = verification?.verification || verification || {};
  const selectedDocuments = selectKycDocuments(documents, {
    selfie: user.selfie_url,
    ineFront: user.id_front_url,
    ineBack: user.id_back_url
  });
  return {
    source: "users",
    sourceLabel: "Usuarios KYC",
    id: cleanKycText(user.id),
    verificationId: cleanKycText(user.kyc_verification_id || linkedVerification.id),
    profileUrl: user.id ? `https://backoffice-kyc.paybridge.com.mx/dashboard/users/${encodeURIComponent(user.id)}` : "",
    status: cleanKycText(user.kyc_status || linkedVerification.status || "Sin estado"),
    createdAt: cleanKycText(user.created_at || linkedVerification.created_at),
    updatedAt: cleanKycText(user.updated_at || linkedVerification.updated_at),
    personal: normalizePersonal({
      firstName: user.first_name,
      paternalSurname: user.apellido_paterno,
      maternalSurname: user.apellido_materno,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.date_of_birth,
      curp: user.curp || linkedVerification.curp,
      sex: linkedVerification.sexo || user.document_data?.sexo,
      profession: user.profession,
      documentType: user.document_type,
      documentNumber: user.document_number || linkedVerification.ocr_identificador || linkedVerification.cic
    }, selectedDocuments),
    checks: normalizeChecks({
      selfieVerified: user.selfie_verified,
      documentVerified: user.id_document_verified,
      addressVerified: user.address_verified,
      livenessVerified: user.liveness_verified,
      livenessScore: user.liveness_score ?? linkedVerification.liveness_score,
      overallConfidence: user.overall_confidence ?? linkedVerification.overall_confidence,
      selfieDuplicated: user.selfie_duplicated,
      documentDuplicated: user.id_document_duplicated,
      riskFactors: linkedVerification.risk_factors || user.risk_factors
    }),
    documents: selectedDocuments
  };
}

export function normalizeKycVerificationRecord(item = {}) {
  const selectedDocuments = selectKycDocuments([], {
    selfie: item.selfie_url,
    ineFront: item.id_front_url,
    ineBack: item.id_back_url
  });
  return {
    source: "verifications",
    sourceLabel: "Verificaciones",
    id: cleanKycText(item.id),
    verificationId: cleanKycText(item.id),
    userId: cleanKycText(item.user_id),
    profileUrl: item.id ? `https://backoffice-kyc.paybridge.com.mx/dashboard/verifications/${encodeURIComponent(item.id)}` : "",
    status: cleanKycText(item.status || "Sin estado"),
    createdAt: cleanKycText(item.created_at),
    updatedAt: cleanKycText(item.updated_at),
    personal: normalizePersonal({
      firstName: item.first_name,
      paternalSurname: item.apellido_paterno,
      maternalSurname: item.apellido_materno,
      lastName: item.last_name,
      email: item.email,
      phone: item.phone,
      dateOfBirth: item.fecha_nacimiento || item.date_of_birth,
      curp: item.curp,
      sex: item.sexo,
      profession: item.occupation || item.profession,
      documentType: item.document_type,
      documentNumber: item.document_number || item.ocr_identificador || item.cic
    }, selectedDocuments),
    checks: normalizeChecks({
      selfieVerified: item.selfie_verified,
      documentVerified: item.id_document_verified,
      addressVerified: item.address_verified,
      livenessVerified: item.liveness_verified,
      livenessScore: item.liveness_score,
      overallConfidence: item.overall_confidence,
      selfieDuplicated: item.selfie_duplicated,
      documentDuplicated: item.id_document_duplicated,
      riskFactors: item.risk_factors,
      hasDuplicates: item.has_duplicates
    }),
    documents: selectedDocuments
  };
}

export function selectKycDocuments(documents = [], fallbacks = {}) {
  const sorted = [...(Array.isArray(documents) ? documents : [])].sort((a, b) => Date.parse(b?.uploadedAt || b?.uploaded_at || 0) - Date.parse(a?.uploadedAt || a?.uploaded_at || 0));
  const result = {};
  for (const [slot, types] of Object.entries(DOCUMENT_SLOTS)) {
    const match = sorted.find((document) => types.includes(cleanKycText(document?.type).toLowerCase()));
    const url = safeKycDocumentUrl(match?.url || fallbacks?.[slot]);
    result[slot] = {
      type: cleanKycText(match?.type || types[0]),
      label: slot === "selfie" ? "Selfie" : slot === "ineFront" ? "INE frente" : "INE reverso",
      url,
      status: cleanKycText(match?.status || (url ? "Disponible" : "No disponible")),
      uploadedAt: cleanKycText(match?.uploadedAt || match?.uploaded_at)
    };
  }
  return result;
}

export function safeKycDocumentUrl(value) {
  const text = cleanKycText(value);
  if (!text) return "";
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function normalizePersonal(values, documents) {
  const paternalSurname = cleanKycText(values.paternalSurname);
  const maternalSurname = cleanKycText(values.maternalSurname);
  const lastName = cleanKycText(values.lastName);
  return {
    firstName: cleanKycText(values.firstName),
    paternalSurname: paternalSurname || lastName.split(" ")[0] || "",
    maternalSurname: maternalSurname || (paternalSurname ? "" : lastName.split(" ").slice(1).join(" ")),
    email: cleanKycText(values.email).toLowerCase(),
    phone: cleanKycText(values.phone),
    dateOfBirth: cleanKycText(values.dateOfBirth),
    curp: cleanKycText(values.curp),
    sex: cleanKycText(values.sex),
    profession: scalarText(values.profession),
    documentType: cleanKycText(values.documentType) || (documents.ineFront.url || documents.ineBack.url ? "INE / IFE" : ""),
    documentNumber: cleanKycText(values.documentNumber)
  };
}

function normalizeChecks(values) {
  return {
    selfieVerified: booleanOrNull(values.selfieVerified),
    documentVerified: booleanOrNull(values.documentVerified),
    addressVerified: booleanOrNull(values.addressVerified),
    livenessVerified: booleanOrNull(values.livenessVerified),
    livenessScore: numberOrNull(values.livenessScore),
    overallConfidence: numberOrNull(values.overallConfidence),
    selfieDuplicated: Boolean(values.selfieDuplicated),
    documentDuplicated: Boolean(values.documentDuplicated),
    hasDuplicates: Boolean(values.hasDuplicates || values.selfieDuplicated || values.documentDuplicated),
    riskFactors: Array.isArray(values.riskFactors) ? values.riskFactors.map((item) => cleanKycText(item?.type || item?.reason || item)).filter(Boolean) : []
  };
}

function scalarText(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return cleanKycText(value);
  return cleanKycText(value?.name || value?.label || value?.value);
}

function booleanOrNull(value) {
  return typeof value === "boolean" ? value : null;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
