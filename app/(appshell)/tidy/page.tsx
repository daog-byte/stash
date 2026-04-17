export default function TidyPage() {
  return (
    <>
      <section className="stash-bento">
        <article className="stash-card">
          <h3>Expiry Triage</h3>
          <p style={{ marginTop: 10 }}>Progress: 4 of 12 reviewed</p>
          <p style={{ color: '#6a6158' }}>One link at a time with AI summary + date saved.</p>
        </article>
        <article className="stash-card">
          <h3>Current Decision</h3>
          <ul className="stash-list">
            <li>Keep - still relevant</li>
            <li>Archive - maybe one day</li>
            <li>Remove - no longer relevant</li>
            <li>Skip for now</li>
          </ul>
        </article>
      </section>

      <section className="stash-grid">
        <article className="stash-card">
          <h3>Displays</h3>
          <ul className="stash-list">
            <li>Progress bar (X of Y)</li>
            <li>Single-link focus</li>
            <li>AI summary with save date</li>
            <li>Three decision actions</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Commands</h3>
          <ul className="stash-list">
            <li>Keep</li>
            <li>Archive</li>
            <li>Remove</li>
            <li>Skip</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Options</h3>
          <ul className="stash-list">
            <li>Undo last decision</li>
            <li>Exit and resume later</li>
          </ul>
        </article>
      </section>
    </>
  );
}
