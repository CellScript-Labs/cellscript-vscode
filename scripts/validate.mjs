import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { SOURCE_SEMANTICS, requireSourceContract } = createRequire(import.meta.url)("../source-contract.js");

const root = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(root, "..", "..");

const requiredFiles = [
  "package.json",
  "extension.js",
  "dist/extension.js",
  "README.md",
  "CHANGELOG.md",
  ".vscodeignore",
  "language-configuration.json",
  "syntaxes/cellscript.tmLanguage.json",
  "snippets/cellscript.json"
];

for (const relative of requiredFiles) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    throw new Error(`missing required file: ${relative}`);
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const cargoTomlPath = path.join(repoRoot, "Cargo.toml");
const cargoToml = fs.existsSync(cargoTomlPath) ? fs.readFileSync(cargoTomlPath, "utf8") : "";
const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const grammar = JSON.parse(fs.readFileSync(path.join(root, "syntaxes/cellscript.tmLanguage.json"), "utf8"));
const languageConfig = JSON.parse(fs.readFileSync(path.join(root, "language-configuration.json"), "utf8"));
const snippets = JSON.parse(fs.readFileSync(path.join(root, "snippets/cellscript.json"), "utf8"));

if (pkg.name !== "cellscript-vscode") {
  throw new Error(`unexpected package name: ${pkg.name}`);
}

if (cargoVersion && pkg.version !== cargoVersion) {
  throw new Error(`extension version ${pkg.version} does not match crate version ${cargoVersion}`);
}

if (!pkg.repository?.url?.includes("CellScript-Labs/cellscript-vscode")) {
  throw new Error(`extension repository must point at standalone extension repo: ${pkg.repository?.url}`);
}

for (const field of [pkg.homepage, pkg.bugs?.url]) {
  if (!field?.includes("CellScript-Labs/cellscript-vscode")) {
    throw new Error(`extension package URL must point at standalone extension repo: ${field}`);
  }
}

const homepageVersion = pkg.homepage?.match(/\/tree\/v([0-9]+\.[0-9]+\.[0-9]+)\//)?.[1];
if (homepageVersion && homepageVersion !== pkg.version) {
  throw new Error(`extension homepage points at v${homepageVersion}, but package version is ${pkg.version}`);
}

if (!Array.isArray(pkg.contributes?.languages) || pkg.contributes.languages.length === 0) {
  throw new Error("package.json must contribute at least one language");
}

if (pkg.main !== "./dist/extension.js") {
  throw new Error(`unexpected extension entrypoint: ${pkg.main}`);
}

const requiredCommands = [
  "cellscript.compileCurrentFile",
  "cellscript.showMetadata",
  "cellscript.showConstraints",
  "cellscript.showAbi",
  "cellscript.showActionBuildPlan",
  "cellscript.generateTypescriptBuilder",
  "cellscript.verifyPackage",
  "cellscript.verifyRegistry",
  "cellscript.verifyLiveRegistry",
  "cellscript.showBuilderAssumptions",
  "cellscript.showTxTemplate",
  "cellscript.showDeployPlan",
  "cellscript.showProfile",
  "cellscript.generateAuditBundle",
  "cellscript.showProductionReport",
  "cellscript.validateLsIdl",
  "cellscript.bindLsIdl",
  "cellscript.fetchLsIdl"
];

const commands = new Set((pkg.contributes?.commands || []).map((command) => command.command));
const activationEvents = new Set(pkg.activationEvents || []);
for (const command of requiredCommands) {
  if (!commands.has(command)) {
    throw new Error(`missing command contribution: ${command}`);
  }
  if (!activationEvents.has(`onCommand:${command}`)) {
    throw new Error(`missing command activation event: ${command}`);
  }
}

const properties = pkg.contributes?.configuration?.properties || {};
for (const setting of [
  "cellscript.compilerPath",
  "cellscript.useCargoRunFallback",
  "cellscript.commandTimeoutMs",
  "cellscript.maxOutputBytes",
  "cellscript.target",
  "cellscript.builderOutputDir",
  "cellscript.ckbRpcUrl",
  "cellscript.deploymentNetwork",
  "cellscript.registryApiUrl",
  "cellscript.registryRequirePublisherSignature",
  "cellscript.registryRequireAuditReport"
]) {
  if (!properties[setting]) {
    throw new Error(`missing configuration setting: ${setting}`);
  }
}

if (!Array.isArray(grammar.patterns) || grammar.patterns.length === 0) {
  throw new Error("grammar must contain top-level patterns");
}

if (grammar.scopeName !== "source.cellscript") {
  throw new Error(`unexpected grammar scope: ${grammar.scopeName}`);
}

if (!languageConfig.comments?.lineComment) {
  throw new Error("language configuration must declare line comments");
}

if (typeof snippets !== "object" || snippets === null || Object.keys(snippets).length === 0) {
  throw new Error("snippets file must contain at least one snippet");
}

const grammarText = JSON.stringify(grammar);
const snippetsText = JSON.stringify(snippets);
for (const token of [
  "create_unique",
  "replace_unique",
  "destroy_singleton_type",
  "destroy_unique",
  "destroy_instance",
  "burn_amount",
  "identity",
  "ckb_type_id",
  "script_args",
  "singleton_type",
  "assert_sum",
  "assert_conserved",
  "assert_delta",
  "assert_distinct",
  "assert_singleton",
  "retarget_type",
  "module",
  "enum",
  "invariant",
  "forall",
  "validity",
  "borrow",
  "consume_each",
  "create_each",
  "BoundedCellSet",
  "BoundedList",
  "InputView",
  "OutputView",
  "by",
  "i32",
  "ScriptHash",
  "type_script",
  "lock_script",
  "type_group",
  "group_input",
  "group_output",
  "pool",
  "retire",
  "fresh"
]) {
  if (!grammarText.includes(token)) {
    throw new Error(`grammar is missing current CellScript editor surface token: ${token}`);
  }
}

for (const snippet of [
  "create_unique",
  "replace_unique",
  "destroy_unique",
  "burn_amount",
  "assert_sum",
  "assert_conserved",
  "assert_delta",
  "assert_distinct",
  "assert_singleton",
  "#[type_id",
  "module ",
  "use ",
  "enum ",
  "enum-payload",
  "invariant-forall",
  "bounded-collection-action",
  "borrow-view",
  "validity",
  "flow-edge-by-action",
  "invariant ",
  "replace-relation",
  "type-script-policy",
  "lock-script-policy"
]) {
  if (!snippetsText.includes(snippet)) {
    throw new Error(`snippets are missing current CellScript authoring surface: ${snippet}`);
  }
}

const extensionSource = fs.readFileSync(path.join(root, "extension.js"), "utf8");
const bundledExtension = fs.readFileSync(path.join(root, "dist/extension.js"), "utf8");
const vscodeIgnore = fs.readFileSync(path.join(root, ".vscodeignore"), "utf8");
const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
for (const token of [
  "LanguageClient",
  "vscode-languageclient/node",
  ...requiredCommands,
  "explain",
  "assumptions",
  "tx",
  "solve",
  "deploy",
  "plan",
  "profile",
  "audit-bundle",
  "artifact",
  "ls-idl",
  "validateLsIdl",
  "bindLsIdl",
  "fetchLsIdl",
  "cellc",
  "Cell.toml",
  "action",
  "gen-builder",
  "package",
  "registry",
  "registryRequirePublisherSignature",
  "registryRequireAuditReport",
  "--require-publisher-signature",
  "--require-audit-report",
  "typescript",
  "--lsp",
  "TransportKind.stdio"
]) {
  if (!extensionSource.includes(token)) {
    throw new Error(`extension runtime is missing expected wiring: ${token}`);
  }
}

if (!bundledExtension.includes("LanguageClient")) {
  throw new Error("bundled extension is missing language client runtime");
}

for (const ignored of ["node_modules/**", "extension.js", "scripts/**"]) {
  if (!vscodeIgnore.includes(ignored)) {
    throw new Error(`.vscodeignore must exclude bundled-only input: ${ignored}`);
  }
}

if (extensionSource.includes('"--target", "riscv64-asm", ...targetProfileArgs(document)')) {
  throw new Error("compile command must not hard-code a second target before configured targetProfileArgs");
}

const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
if (/\bbeta\b|\bthin\b|placeholder|metadata-only/i.test(readme)) {
  throw new Error("extension README must describe the production local tooling surface, not beta/thin placeholder scope");
}
if (readme.includes("cellc lsp --stdio")) {
  throw new Error("extension README must document the supported LSP entrypoint as `cellc --lsp`");
}
for (const token of [
  "workspace rename",
  "selection ranges",
  "document symbols",
  "document highlights",
  "Edition 2027 authoring-v3 source contract"
]) {
  if (!readme.includes(token)) {
    throw new Error(`extension README is missing current LSP/package coverage: ${token}`);
  }
}
if (!changelog.includes(`## ${pkg.version}`)) {
  throw new Error(`extension changelog is missing current package version entry: ${pkg.version}`);
}

console.log("CellScript VS Code extension manifest is valid.");

for (const type of ["ZkTransitionProof", "VerificationKeyCommitment", "ExactScriptHandle"]) {
  if (!grammar.repository.types.patterns.some(pattern => new RegExp(pattern.match).test(type))) throw new Error(`Missing exact ZK type: ${type}`);
}
if (!snippets["Exact ZK transition"]?.body?.join("\n").includes("zk::require_valid")) throw new Error("Missing exact ZK snippet");

const contract = { schema: "cellscript-source-language-contract-v1", compiler_version: pkg.version,
  edition: "2027", source_semantics: SOURCE_SEMANTICS, identifier_unicode_version: "17.0.0", max_source_bytes: 1048576 };
assert.equal(requireSourceContract(contract), contract);
for (const invalid of [null, {}, {...contract, source_semantics: "cellscript-source-semantics-2027-0.33-authoring-v2"},
  {...contract, identifier_unicode_version: "16.0.0"}, {...contract, unexpected: true}]) {
  assert.throws(() => requireSourceContract(invalid), /source contract mismatch/);
}
const checkerSchema = path.join(repoRoot, "crates/cellscript-artifact-checker/src/schema.rs");
if (fs.existsSync(checkerSchema)) {
  assert.ok(fs.readFileSync(checkerSchema, "utf8").includes(`SOURCE_SEMANTICS_2027: &str = "${SOURCE_SEMANTICS}"`));
}
assert.ok(!snippetsText.includes("verification"), "retired verification marker must not be emitted");
assert.ok(snippets["Module"].body[0].endsWith(";"));
assert.ok(snippets["Generic Call"].body[0].includes("::<"));
assert.ok(snippets["Value Construction"].body[0].startsWith("new "));
