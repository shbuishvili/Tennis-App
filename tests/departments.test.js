import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDepartmentAccess, serializeDepartmentAccess, departmentAccessLabel } from '../src/departments.js';

test('legacy single department and all values still work', () => {
  assert.deepEqual(parseDepartmentAccess('padel', 'staff'), ['padel']);
  assert.equal(parseDepartmentAccess('all', 'manager').length, 4);
});

test('multiple selected departments round trip through the database field', () => {
  const stored = serializeDepartmentAccess(['padel', 'tennis']);
  assert.equal(stored, 'tennis,padel');
  assert.deepEqual(parseDepartmentAccess(stored, 'staff'), ['tennis', 'padel']);
  assert.match(departmentAccessLabel(stored, 'staff'), /პადელი/);
});

test('super administrator always has all departments', () => {
  assert.equal(parseDepartmentAccess('tennis', 'super_admin').length, 4);
  assert.equal(serializeDepartmentAccess(['tennis', 'equestrian', 'quad', 'padel']), 'all');
});
