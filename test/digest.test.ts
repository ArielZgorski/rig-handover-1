import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('run log reader', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line, sorted by job', () => {
    const d = readNight('runs', '2026-10-28');
    expect(d).not.toBeNull();
    expect(d!.badLines).toBe(1);
    expect(d!.rows.map((r) => r.job)).toEqual([
      'digest/render', 'fixtures/refresh', 'lane/sync', 'notes/backup', 'rig/rotate-logs',
    ]);
  });

  it('keeps a null owner and counts retries and fails', () => {
    const rows = readNight('runs', '2026-10-28')!.rows;
    const byJob = Object.fromEntries(rows.map((r) => [r.job, r]));
    expect(byJob['digest/render']!.owner).toBeNull();
    expect(byJob['fixtures/refresh']).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503' });
    expect(byJob['notes/backup']).toMatchObject({ fails: 1, lastStatus: 'fail', lastError: 'quota exceeded' });
    expect(byJob['lane/sync']!.firstAt).toBe('2026-10-28T23:00:06+01:00');
  });

  it('returns null for a night with no file or a bad name', () => {
    expect(readNight('runs', '2026-01-01')).toBeNull();
    expect(readNight('runs', '../package')).toBeNull();
  });
});
