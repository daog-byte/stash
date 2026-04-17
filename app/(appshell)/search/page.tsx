export default function SearchPage() {
  return (
    <>
      <section className="stash-bento">
        <article className="stash-card">
          <h3>Search Input</h3>
          <input className="stash-inline-input" placeholder="Type query (natural language)" />
          <p style={{ marginTop: 10, color: '#6a6158' }}>
            Search is always focused and supports meaning-based retrieval.
          </p>
        </article>
        <article className="stash-card">
          <h3>Quick Filters</h3>
          <ul className="stash-list">
            <li>Filter by platform</li>
            <li>Filter by date range</li>
            <li>Filter by priority</li>
          </ul>
        </article>
      </section>

      <section className="stash-grid">
        <article className="stash-card">
          <h3>Displays</h3>
          <ul className="stash-list">
            <li>AI label: searching by meaning</li>
            <li>Topic pills for quick filters</li>
            <li>Results with title, snippet, source, date</li>
            <li>Empty state when no results</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Commands</h3>
          <ul className="stash-list">
            <li>Type natural language query</li>
            <li>Tap topic pill</li>
            <li>Tap result to open detail</li>
            <li>Clear search</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Options</h3>
          <ul className="stash-list">
            <li>Platform filter</li>
            <li>Date-range filter</li>
            <li>Priority filter</li>
          </ul>
        </article>
      </section>
    </>
  );
}
