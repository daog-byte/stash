export default function AccountPage() {
  return (
    <>
      <section className="stash-bento">
        <article className="stash-card">
          <h3>Profile + Connections</h3>
          <ul className="stash-list">
            <li>Profile information</li>
            <li>Connected platforms and status</li>
            <li>iOS Shortcut setup</li>
            <li>Digest preferences</li>
            <li>Stats: total saved, read rate</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Quick Actions</h3>
          <ul className="stash-list">
            <li>Connect/disconnect platform</li>
            <li>Download iOS Shortcut</li>
            <li>Change digest day/time</li>
            <li>Export all data</li>
            <li>Log out / Delete account</li>
          </ul>
        </article>
      </section>

      <section className="stash-grid">
        <article className="stash-card">
          <h3>Displays</h3>
          <ul className="stash-list">
            <li>Profile info</li>
            <li>Connected platforms + status</li>
            <li>Shortcut setup + digest preferences</li>
            <li>Usage stats</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Commands</h3>
          <ul className="stash-list">
            <li>Connect/disconnect platform</li>
            <li>Download shortcut</li>
            <li>Change digest schedule</li>
            <li>Export data</li>
            <li>Log out and delete account</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Options</h3>
          <ul className="stash-list">
            <li>Digest on/off</li>
            <li>Tidy-up threshold: 30, 60, 90 days</li>
            <li>Default sort order</li>
          </ul>
        </article>
      </section>
    </>
  );
}
