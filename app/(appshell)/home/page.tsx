import Link from 'next/link';

export default function HomeScreen() {
  return (
    <>
      <section className="stash-bento">
        <article className="stash-card">
          <h3>Weekly Digest Banner</h3>
          <ul className="stash-list">
            <li>Every Monday, fresh picks based on your most recent saves.</li>
            <li>Curated feed targets 5 cards max to keep focus high.</li>
            <li>Each card shows title, summary, source, priority, and days saved.</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Tab Bar</h3>
          <ul className="stash-list">
            <li>Today</li>
            <li>All saved</li>
            <li>By topic</li>
          </ul>
        </article>
      </section>

      <section className="stash-grid">
        <article className="stash-card">
          <h3>Displays</h3>
          <ul className="stash-list">
            <li>Weekly digest banner (Mondays)</li>
            <li>Curated feed - max 5 cards</li>
            <li>Each card: title, summary, source, priority tag, days saved</li>
            <li>Tidy up nudge if 90+ day items exist</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Commands</h3>
          <ul className="stash-list">
            <li>Read - open <Link href="/link/sample-001">link detail</Link></li>
            <li>Later - keep in queue</li>
            <li>Tap card to open detail</li>
            <li>Switch tabs between Today/All/By topic</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Options</h3>
          <ul className="stash-list">
            <li>Filter by urgent, pending, archived</li>
            <li>Filter by platform</li>
            <li>Sort by newest, oldest, priority</li>
          </ul>
        </article>
      </section>
    </>
  );
}
