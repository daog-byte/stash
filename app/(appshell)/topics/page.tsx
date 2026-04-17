import Link from 'next/link';

export default function TopicsPage() {
  return (
    <>
      <section className="stash-bento">
        <article className="stash-card">
          <h3>Topic Clusters</h3>
          <ul className="stash-list">
            <li>Auto-generated clusters: Product, AI, Design, Growth</li>
            <li>Count per topic with most recent save</li>
            <li>Topic detail opens filtered link list</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Sample Topic</h3>
          <p style={{ marginTop: 10 }}>AI product strategy</p>
          <p style={{ color: '#6a6158' }}>12 links • newest 2 days ago</p>
          <p style={{ marginTop: 10 }}>
            <Link href="/link/sample-001">Open recent link</Link>
          </p>
        </article>
      </section>

      <section className="stash-grid">
        <article className="stash-card">
          <h3>Displays</h3>
          <ul className="stash-list">
            <li>Auto-generated topic clusters</li>
            <li>Count per topic</li>
            <li>Most recent save per topic</li>
            <li>Topic detail list</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Commands</h3>
          <ul className="stash-list">
            <li>Tap topic to open filtered list</li>
            <li>Tap link to open detail</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Options</h3>
          <ul className="stash-list">
            <li>Rename topic</li>
            <li>Merge topics</li>
          </ul>
        </article>
      </section>
    </>
  );
}
