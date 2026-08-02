import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import {
  configureDriveProfile,
  currentDriveProfile,
  loadDriveProfile,
  resetDriveProfile,
} from '../src/dimensions.js';
import { newState, settleState, topDrives } from '../src/engine.js';

test('bundled Wenzhou profile loads and drives new state', () => {
  try {
    const profile = loadDriveProfile(resolve('configs/wenzhou-tg.json'));
    assert.equal(profile.initialValue, 0.12);
    assert.equal(profile.dimensions.possess.growPerHour, 0.018);
    assert.match(profile.dimensions.share.label, /分享给栖/);
    const state = newState(new Date('2026-08-02T00:00:00Z'));
    assert.equal(state.drives.curiosity, 0.12);
    assert.equal(topDrives(state, 1)[0].label, '想靠近栖、确认彼此的连接');
  } finally {
    resetDriveProfile();
  }
});

test('profile changes migrate old drive keys on settlement', () => {
  try {
    configureDriveProfile({
      initialValue: 0.2,
      dimensions: {
        wonder: { label: '保留好奇', growPerHour: 0.01, satisfyMul: 0.5, dawnFreeze: true },
      },
    });
    const old = newState(new Date('2026-08-02T00:00:00Z'));
    old.drives = { obsolete: 0.9 };
    const settled = settleState(old, new Date('2026-08-02T00:00:00Z'), 90);
    assert.deepEqual(settled.state.drives, { wonder: 0.2 });
  } finally {
    resetDriveProfile();
  }
});

test('invalid profiles fail closed with useful errors', () => {
  assert.throws(
    () => configureDriveProfile({ dimensions: { 'Bad Key': { label: 'x' } } }),
    /invalid drive key/,
  );
  assert.throws(
    () => configureDriveProfile({
      dimensions: { calm: { label: '平静', inhibitedBy: { missing: 0.5 } } },
    }),
    /references unknown drive/,
  );
  resetDriveProfile();
  assert.equal(currentDriveProfile().initialValue, 0.15);
});
