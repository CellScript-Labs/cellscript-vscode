// A release number does not identify an evolving alpha source grammar.
const SOURCE_SEMANTICS = "cellscript-source-semantics-2027-0.33-authoring-v3";
const FIELDS = ["schema", "compiler_version", "edition", "source_semantics", "identifier_unicode_version", "max_source_bytes"].sort();

function requireSourceContract(contract) {
  if (!contract || typeof contract !== "object" || Array.isArray(contract)
      || JSON.stringify(Object.keys(contract).sort()) !== JSON.stringify(FIELDS)
      || contract.schema !== "cellscript-source-language-contract-v1" || contract.edition !== "2027"
      || contract.source_semantics !== SOURCE_SEMANTICS
      || contract.identifier_unicode_version !== "17.0.0"
      || typeof contract.compiler_version !== "string"
      || !Number.isSafeInteger(contract.max_source_bytes) || contract.max_source_bytes <= 0) {
    throw new Error(`CellScript source contract mismatch. Select or build cellc supporting ${SOURCE_SEMANTICS}; the release version alone is insufficient.`);
  }
  return contract;
}

module.exports = { SOURCE_SEMANTICS, requireSourceContract };
