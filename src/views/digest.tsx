import type { Digest, DigestRow } from '../digest/types.js';

const dash = (v: string | null) => v ?? '—';

function flagged(r: DigestRow): boolean {
  return r.retries >= 3 || r.fails > 0;
}

export function DigestPage({ digest }: { digest: Digest }) {
  return (
    <>
      <h1>digest · {digest.night}</h1>
      <p class="mute">
        ok {digest.counts.ok} · retry {digest.counts.retry} · fail {digest.counts.fail}
        {digest.badLines > 0 ? <span class="warn"> · {digest.badLines} unreadable line{digest.badLines === 1 ? '' : 's'}</span> : null}
      </p>
      {digest.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th><th>owner</th><th>runs</th><th>retries</th><th>last status</th><th>last error</th><th>first</th><th>last</th>
            </tr>
          </thead>
          <tbody>
            {digest.rows.map((r) => (
              <tr class={flagged(r) ? 'warn' : undefined}>
                <td>{r.job}</td>
                <td>{dash(r.owner)}</td>
                <td>{r.runs}</td>
                <td>{r.retries >= 3 ? <strong>{r.retries} ⚠</strong> : r.retries}</td>
                <td>{r.fails > 0 ? <strong>{r.lastStatus}{r.lastStatus === 'fail' ? ' ✗' : ` (${r.fails} fail)`}</strong> : r.lastStatus}</td>
                <td>{dash(r.lastError)}</td>
                <td>{r.firstAt}</td>
                <td>{r.lastAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
