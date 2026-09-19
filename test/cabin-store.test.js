import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { CabinStore } from '../src/cabin-store.js';

test('locked user notes stay out of the AI inbox until the user unlocks them', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'xinchao-cabin-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = new CabinStore(join(directory, 'cabin.json'));

  const created = await store.addNote({
    eventId: 'note-event-0001',
    from: 'user',
    content: '这是一封只在开锁后才能被看到的信。',
    locked: true,
  });
  assert.equal((await store.unlockedUserNotes()).length, 0);

  const unlocked = await store.setNoteLock(created.note.id, false);
  assert.equal(unlocked.changed, true);
  assert.equal((await store.unlockedUserNotes())[0].content, '这是一封只在开锁后才能被看到的信。');
  const delivered = await store.takeUnlockedUserNotes({}, new Date('2026-09-19T10:00:00.000Z'));
  assert.equal(delivered[0].aiReadAt, '2026-09-19T10:00:00.000Z');
  assert.equal((await store.unlockedUserNotes()).length, 0);
  assert.equal((await store.unlockedUserNotes({ includeRead: true })).length, 1);

  await store.setNoteLock(created.note.id, true);
  const reopened = await store.setNoteLock(created.note.id, false);
  assert.equal(reopened.note.aiReadAt, '2026-09-19T10:00:00.000Z');
  assert.equal((await store.takeUnlockedUserNotes()).length, 0);

  const duplicate = await store.addNote({
    eventId: 'note-event-0001',
    from: 'user',
    content: '重试不应覆盖原文',
  });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.note.content, '这是一封只在开锁后才能被看到的信。');
});

test('concurrent AI inbox reads deliver each unread user note only once', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'xinchao-cabin-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = new CabinStore(join(directory, 'cabin.json'));

  await store.addNote({
    eventId: 'note-event-concurrent-1',
    from: 'user',
    content: '并发读取时只交付一次。',
    locked: false,
  });
  const reads = await Promise.all([
    store.takeUnlockedUserNotes({}, new Date('2026-09-19T11:00:00.000Z')),
    store.takeUnlockedUserNotes({}, new Date('2026-09-19T11:00:01.000Z')),
  ]);
  assert.deepEqual(reads.map((notes) => notes.length).sort(), [0, 1]);
});

test('schema v1 migration does not replay already-unlocked history', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'xinchao-cabin-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, 'cabin.json');
  await writeFile(path, `${JSON.stringify({
    schemaVersion: 1,
    notes: [
      {
        id: 'legacy-open', eventId: 'legacy-open-event', from: 'user', content: '旧的已解锁来信',
        locked: false, unlockedAt: '2026-09-01T00:00:00.000Z', createdAt: '2026-09-01T00:00:00.000Z', readAt: '2026-09-01T00:00:00.000Z',
      },
      {
        id: 'legacy-locked', eventId: 'legacy-locked-event', from: 'user', content: '旧的上锁来信',
        locked: true, unlockedAt: null, createdAt: '2026-09-02T00:00:00.000Z', readAt: '2026-09-02T00:00:00.000Z',
      },
    ],
    ledger: [],
  }, null, 2)}\n`, 'utf8');

  const store = new CabinStore(path);
  await store.init();
  assert.equal((await store.takeUnlockedUserNotes()).length, 0);
  assert.equal((await store.unlockedUserNotes({ includeRead: true }))[0].aiReadAt, '2026-09-01T00:00:00.000Z');

  await store.setNoteLock('legacy-locked', false, new Date('2026-09-19T12:00:00.000Z'));
  assert.equal((await store.takeUnlockedUserNotes()).length, 1);
  const migrated = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(migrated.schemaVersion, 2);
});

test('AI unread notes and love ledger totals are persisted and editable', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'xinchao-cabin-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = new CabinStore(join(directory, 'cabin.json'));

  await store.addNote({ eventId: 'ai-note-event-1', from: 'ai', content: '我给你留了一句话。' });
  assert.equal((await store.snapshot()).unreadAiNotes, 1);
  await store.markAiNotesRead();
  assert.equal((await store.snapshot()).unreadAiNotes, 0);

  const expense = await store.addLedger({ eventId: 'ledger-expense-1', type: 'expense', item: '晚餐', amount: 88.88, date: '2026-08-09' });
  await store.addLedger({ eventId: 'ledger-income-1', type: 'income', item: '共同基金', amount: 20, date: '2026-08-09' });
  assert.deepEqual((await store.snapshot()).totals, { expense: 88.88, income: 20, net: 68.88 });

  await store.updateLedger(expense.entry.id, { amount: 66.66 });
  assert.deepEqual((await store.snapshot()).totals, { expense: 66.66, income: 20, net: 46.66 });
  await store.deleteLedger(expense.entry.id);
  assert.deepEqual((await store.snapshot()).totals, { expense: 0, income: 20, net: -20 });
});
