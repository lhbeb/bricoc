#!/usr/bin/env node

import fs from 'node:fs';
import crypto from 'node:crypto';

const sourceEnvPath = process.env.SOURCE_ENV_FILE || '.env.local';

function parseEnv(path) {
  const values = {};
  for (const rawLine of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

const sourceEnv = parseEnv(sourceEnvPath);
const source = {
  url: sourceEnv.NEXT_PUBLIC_SUPABASE_URL,
  key: sourceEnv.SUPABASE_SERVICE_ROLE_KEY,
};
const target = {
  url: process.env.TARGET_SUPABASE_URL,
  key: process.env.TARGET_SUPABASE_SERVICE_ROLE_KEY,
};

for (const [name, value] of Object.entries({
  SOURCE_SUPABASE_URL: source.url,
  SOURCE_SUPABASE_SERVICE_ROLE_KEY: source.key,
  TARGET_SUPABASE_URL: target.url,
  TARGET_SUPABASE_SERVICE_ROLE_KEY: target.key,
})) {
  if (!value) throw new Error(`Missing ${name}`);
}

const tables = [
  { name: 'brands', conflict: 'id' },
  { name: 'categories', conflict: 'id' },
  { name: 'sellers', conflict: 'username' },
  { name: 'admin_permissions', conflict: 'permission_key' },
  { name: 'admin_roles', conflict: 'email' },
  { name: 'products', conflict: 'id' },
  { name: 'payment_settings', conflict: 'provider' },
  { name: 'orders', conflict: 'id' },
  { name: 'checkout_link_rotation_counters', conflict: 'product_slug' },
  { name: 'admin_audit_log', conflict: 'id' },
  { name: 'error_logs', conflict: 'id' },
];

function authHeaders(project, extra = {}) {
  return {
    apikey: project.key,
    Authorization: `Bearer ${project.key}`,
    ...extra,
  };
}

async function request(url, options = {}, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const details = (await response.text()).slice(0, 1000);
        if (attempt < retries - 1 && (response.status >= 500 || response.status === 429)) {
          console.log(`Retry ${attempt + 1}/${retries} for ${options.method || 'GET'} ${url} (${response.status})`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }
        throw new Error(`${options.method || 'GET'} ${url} failed (${response.status}): ${details}`);
      }
      return response;
    } catch (error) {
      if (attempt < retries - 1 && error.name !== 'AbortError') {
        console.log(`Retry ${attempt + 1}/${retries} for ${url} (network error)`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
}

async function fetchRows(project, table) {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const response = await request(`${project.url}/rest/v1/${table}?select=*`, {
      headers: authHeaders(project, {
        Range: `${offset}-${offset + pageSize - 1}`,
      }),
    });
    const page = await response.json();
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

async function upsertRows(table, conflict, rows) {
  const batchSize = 200;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    await request(`${target.url}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflict)}`, {
      method: 'POST',
      headers: authHeaders(target, {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify(batch),
    });
  }
}

function encodedObjectPath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function listBuckets(project) {
  const response = await request(`${project.url}/storage/v1/bucket`, {
    headers: authHeaders(project),
  });
  return response.json();
}

async function ensureBucket(bucket) {
  const existing = await listBuckets(target);
  const payload = {
    id: bucket.id,
    name: bucket.name,
    public: bucket.public,
    file_size_limit: bucket.file_size_limit,
    allowed_mime_types: bucket.allowed_mime_types,
  };
  if (existing.some((candidate) => candidate.id === bucket.id)) {
    await request(`${target.url}/storage/v1/bucket/${encodeURIComponent(bucket.id)}`, {
      method: 'PUT',
      headers: authHeaders(target, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
  } else {
    await request(`${target.url}/storage/v1/bucket`, {
      method: 'POST',
      headers: authHeaders(target, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
  }
}

async function listObjects(project, bucketId, prefix = '') {
  const objects = [];
  const folders = [prefix];
  while (folders.length) {
    const currentPrefix = folders.pop();
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const response = await request(`${project.url}/storage/v1/object/list/${encodeURIComponent(bucketId)}`, {
        method: 'POST',
        headers: authHeaders(project, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          prefix: currentPrefix,
          limit: pageSize,
          offset,
          sortBy: { column: 'name', order: 'asc' },
        }),
      });
      const entries = await response.json();
      for (const entry of entries) {
        const path = currentPrefix ? `${currentPrefix}/${entry.name}` : entry.name;
        if (entry.id || entry.metadata) objects.push({ ...entry, path });
        else folders.push(path);
      }
      if (entries.length < pageSize) break;
    }
  }
  return objects.sort((a, b) => a.path.localeCompare(b.path));
}

async function downloadObject(project, bucketId, path) {
  const response = await request(
    `${project.url}/storage/v1/object/authenticated/${encodeURIComponent(bucketId)}/${encodedObjectPath(path)}`,
    { headers: authHeaders(project) },
  );
  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') || 'application/octet-stream',
  };
}

async function uploadObject(bucketId, path, object) {
  await request(`${target.url}/storage/v1/object/${encodeURIComponent(bucketId)}/${encodedObjectPath(path)}`, {
    method: 'POST',
    headers: authHeaders(target, {
      'Content-Type': object.contentType,
      'x-upsert': 'true',
    }),
    body: object.bytes,
  });
}

function digest(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

async function migrateTables() {
  const copied = {};
  for (const table of tables) {
    const rows = await fetchRows(source, table.name);
    await upsertRows(table.name, table.conflict, rows);
    copied[table.name] = rows.length;
    console.log(`table ${table.name}: copied ${rows.length}`);
  }
  return copied;
}

async function migrateStorage() {
  const buckets = await listBuckets(source);
  const copied = {};
  for (const bucket of buckets) {
    await ensureBucket(bucket);
    const objects = await listObjects(source, bucket.id);
    let verified = 0;
    let nextIndex = 0;
    const workerCount = Math.min(12, Math.max(1, objects.length));
    async function worker() {
      while (true) {
        const index = nextIndex++;
        if (index >= objects.length) return;
        const entry = objects[index];
        const sourceObject = await downloadObject(source, bucket.id, entry.path);
        await uploadObject(bucket.id, entry.path, sourceObject);
        const targetObject = await downloadObject(target, bucket.id, entry.path);
        if (digest(sourceObject.bytes) !== digest(targetObject.bytes)) {
          throw new Error(`Storage verification failed for ${bucket.id}/${entry.path}`);
        }
        verified += 1;
        if (verified % 100 === 0 || verified === objects.length) {
          console.log(`storage ${bucket.id}: copied and verified ${verified}/${objects.length}`);
        }
      }
    }
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    copied[bucket.id] = verified;
  }
  return copied;
}

async function verifyTables(expected) {
  for (const table of tables) {
    const targetRows = await fetchRows(target, table.name);
    if (targetRows.length < expected[table.name]) {
      throw new Error(
        `Table verification failed for ${table.name}: expected at least ${expected[table.name]}, found ${targetRows.length}`,
      );
    }
    console.log(`verify ${table.name}: target has ${targetRows.length}`);
  }
}

const expected = await migrateTables();
const storage = await migrateStorage();
await verifyTables(expected);
console.log(`migration complete: ${Object.values(expected).reduce((sum, count) => sum + count, 0)} rows, ${Object.values(storage).reduce((sum, count) => sum + count, 0)} objects`);
