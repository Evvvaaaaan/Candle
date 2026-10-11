import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mutations } from '../src/js/candle-service.mjs';
import { demoSnapshot, demoLegal, demoChallengeReward } from '../src/js/demo-service.mjs';

const spec = JSON.parse(await readFile(new URL('../docs/openapi.json', import.meta.url), 'utf8'));
// Validate fixture responses against the published schema subset used here.
// This catches contract drift (missing/unknown fields, enums and primitive types).
function validate(value, schema) {
  if (schema.$ref) return validate(value, spec.components.schemas[schema.$ref.split('/').at(-1)]);
  if (schema.oneOf) {
    assert.ok(
      schema.oneOf.some((x) => {
        try {
          validate(value, x);
          return true;
        } catch {
          return false;
        }
      })
    );
    return;
  }
  if ('const' in schema) assert.deepEqual(value, schema.const);
  if (schema.enum) assert.ok(schema.enum.includes(value));
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    assert.ok(
      types.some((t) =>
        t === 'null'
          ? value === null
          : t === 'integer'
            ? Number.isInteger(value)
            : t === 'array'
              ? Array.isArray(value)
              : t === 'object'
                ? value !== null && typeof value === 'object' && !Array.isArray(value)
                : typeof value === t
      )
    );
  }
  if (value === null) return;
  if (schema.minimum !== undefined) assert.ok(value >= schema.minimum);
  if (schema.pattern) assert.match(value, new RegExp(schema.pattern));
  if (schema.items) value.forEach((x) => validate(x, schema.items));
  if (schema.properties) {
    for (const key of schema.required || []) assert.ok(key in value, `Missing ${key}`);
    for (const [key, item] of Object.entries(value)) {
      if (schema.additionalProperties === false) assert.ok(key in schema.properties, `Unexpected ${key}`);
      if (schema.properties[key]) validate(item, schema.properties[key]);
    }
  }
}
test('every frontend mutation has matching OpenAPI method and security headers', () => {
  for (const [method, path] of Object.values(mutations)) {
    const operation = spec.paths[path]?.[method.toLowerCase()];
    assert.ok(operation, path);
    for (const header of ['X-CSRF-Token', 'Idempotency-Key'])
      assert.ok(operation.parameters.some((p) => p.name === header && p.required));
  }
});
test('published response schemas accept the actual contract fixtures', () => {
  const snapshot = demoSnapshot();
  for (const [key, type] of Object.entries({
    tickets: 'Tickets',
    predictions: 'Predictions',
    wallet: 'Wallet',
    missions: 'Missions',
    catalog: 'Catalog',
    claims: 'ClaimPage',
  }))
    validate(snapshot[key], spec.components.schemas[type]);
  validate(demoLegal, spec.components.schemas.Agreements);
  validate(demoChallengeReward(), spec.components.schemas.ChallengeReward);
});
test('OpenAPI references resolve and implemented endpoints are not overstated', () => {
  const refs = JSON.stringify(spec).matchAll(/"\$ref":"#\/components\/schemas\/([^"]+)"/g);
  for (const [, name] of refs) assert.ok(spec.components.schemas[name], name);
  assert.equal(spec.paths['/stocks/top-list'].get['x-implementation-status'], 'verified-in-local-backend');
  assert.equal(spec.paths['/predictions'].post['x-implementation-status'], 'proposed');
});
