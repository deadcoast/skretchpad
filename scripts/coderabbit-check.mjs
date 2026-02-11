import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const configPath = path.join(repoRoot, '.coderabbit.yaml');
const schemaPath = path.join(repoRoot, 'integrations', 'schema.v2.json');
const integrationsRoot = path.join(repoRoot, 'integrations', 'coderabbit');
const requiredSnapshotDirs = [
  '03_issue-management',
  '04_configuration',
  '05_knowledge-base',
];

function fail(message, details = []) {
  console.error(`coderabbit:check failed: ${message}`);
  for (const line of details) {
    console.error(`- ${line}`);
  }
  process.exit(1);
}

function ensurePathExists(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    fail(`${label} is missing`, [targetPath]);
  }
}

function parseYamlConfig() {
  const raw = fs.readFileSync(configPath, 'utf8');
  const doc = parseDocument(raw, { prettyErrors: true });

  if (doc.errors.length > 0) {
    fail(
      '.coderabbit.yaml contains YAML parse errors',
      doc.errors.map((e) => String(e)),
    );
  }

  const warnings = doc.warnings.map((w) => String(w));
  const data = doc.toJSON();
  if (!data || typeof data !== 'object') {
    fail('.coderabbit.yaml did not parse into a YAML object');
  }

  return { data, warnings };
}

function validateAgainstSchema(data) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateSchema: false,
  });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(data);
  if (!ok) {
    const errors = (validate.errors || []).map((err) => {
      const at = err.instancePath || '/';
      return `${at}: ${err.message}`;
    });
    fail('.coderabbit.yaml failed schema validation', errors);
  }
}

function validateSnapshotLayout() {
  const missing = requiredSnapshotDirs.filter(
    (dirName) => !fs.existsSync(path.join(integrationsRoot, dirName)),
  );
  if (missing.length > 0) {
    fail('Required CodeRabbit snapshot directories are missing', missing);
  }
}

function main() {
  ensurePathExists(configPath, '.coderabbit.yaml');
  ensurePathExists(schemaPath, 'integrations/schema.v2.json');
  ensurePathExists(integrationsRoot, 'integrations/coderabbit');

  const { data, warnings } = parseYamlConfig();
  validateAgainstSchema(data);
  validateSnapshotLayout();

  if (warnings.length > 0) {
    console.warn('coderabbit:check warnings:');
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  console.log('coderabbit:check passed');
}

main();
