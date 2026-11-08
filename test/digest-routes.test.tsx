import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

let dir: string;
const app = () => createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: dir });

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  writeFileSync(join(dir, '2026-11-01.jsonl'), '');
  writeFileSync(
    join(dir, '2026-11-02.jsonl'),
    [
      '{"at":"2026-11-02T01:00:00+01:00","job":"b/job","status":"ok","owner":null}',
      '{"at":"2026-11-02T01:00:00+01:00","job":"a/job","status":"fail","owner":"rook","error":"boom"}',
      '{"at":"2026-11-02T02:00',
    ].join('\n'),
  );
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('GET /digest/:night', () => {
  it('200 with rows sorted by job, null owner as —, fail marked, bad line counted', async () => {
    const res = await app().request('/digest/2026-11-02');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
    expect(html).toContain('—');
    expect(html).toContain('class="warn"');
    expect(html).toContain('1 unreadable line');
  });

  it('404 for a night with no file', async () => {
    expect((await app().request('/digest/2026-10-01')).status).toBe(404);
  });

  it('renders "nothing ran" for an empty night', async () => {
    const res = await app().request('/digest/2026-11-01');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });
});

describe('GET /api/digest/:night', () => {
  it('200 with the same jobs in the same order as the page', async () => {
    const res = await app().request('/api/digest/2026-11-02');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { rows: { job: string }[]; badLines: number };
    expect(body.rows.map((r) => r.job)).toEqual(['a/job', 'b/job']);
    expect(body.badLines).toBe(1);
  });

  it('404 for a night with no file', async () => {
    expect((await app().request('/api/digest/2026-10-01')).status).toBe(404);
  });

  it('empty night returns no rows', async () => {
    const body = (await (await app().request('/api/digest/2026-11-01')).json()) as { rows: unknown[] };
    expect(body.rows).toEqual([]);
  });
});

describe('status board', () => {
  it('links each night on disk to its digest with counts', async () => {
    const html = await (await app().request('/')).text();
    expect(html).toContain('href="/digest/2026-11-02"');
    expect(html).toContain('ok 1 · retry 0 · fail 1');
    expect(html).toContain('href="/digest/2026-11-01"');
  });
});
