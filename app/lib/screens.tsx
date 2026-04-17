// Secondary product screens — used as the flow progresses after onboarding.

export function PicksScreen() {
  return (
    <article className="screen">
      <header className="top-bar">
        <h2>STASH</h2>
        <div className="header-actions">
          <button type="button" className="icon-button" aria-label="Search">
            Q
          </button>
          <span className="avatar">YO</span>
        </div>
      </header>

      <div className="notice">
        <span className="dot" />
        Your weekly pick - 5 things worth your time this week
      </div>

      <div className="segmented-control">
        <button type="button" className="segment-active">
          Today&apos;s picks
        </button>
        <button type="button">All saved</button>
        <button type="button">By topic</button>
      </div>

      <p className="section-label">Act on these</p>
      <Card
        title="The overlooked power of negative space in UI design"
        source="smashingmagazine.com"
        summary="Argues that designers consistently overload screens with elements when restraint would communicate more clearly."
        badge="urgent"
      />
      <Card
        title="How Figma's new dev mode actually changes handoff"
        source="uxdesign.cc"
        summary="A practical walkthrough of the new inspect panel and code export with specific workflow comparisons."
        badge="pending"
      />

      <p className="section-label">Worth revisiting</p>
      <Card
        title="Shape Up: Stop running in circles, ship work that matters"
        source="basecamp.com"
        summary="Covers appetite-based scoping, hill charts, and why sprints often create the wrong kind of urgency."
        badge="archive"
      />
    </article>
  );
}

export function DetailScreen() {
  return (
    <article className="screen">
      <a href="#" className="back-link">
        Back to picks
      </a>
      <div className="title-row">
        <p className="meta-pill">X (Twitter)</p>
        <p className="meta-text">Saved 9 days ago</p>
        <p className="status-pill">pending</p>
      </div>

      <h2 className="detail-title">How Figma&apos;s new dev mode actually changes handoff</h2>
      <p className="meta-source">uxdesign.cc</p>

      <div className="reason-card">
        <p className="section-label">Why you saved this</p>
        <p>
          A practical walkthrough of the new inspect panel and code export that highlights what actually changed
          versus the marketing story.
        </p>
      </div>

      <div className="tag-row">
        <span>UX design</span>
        <span>tools</span>
        <span>handoff</span>
        <span>Figma</span>
      </div>

      <button type="button" className="primary-cta">
        Read the full article
      </button>

      <div className="action-grid">
        <button type="button">Share</button>
        <button type="button">Save again</button>
        <button type="button" className="danger-button">
          Archive
        </button>
      </div>

      <p className="section-label">More on this topic</p>
      <ul className="topic-links">
        <li>Bridging the gap between design and engineering</li>
        <li>Why design tokens matter more than your style guide</li>
      </ul>
    </article>
  );
}

export function TidyScreen() {
  return (
    <article className="screen">
      <h2>Tidy up</h2>
      <p className="lede">12 links haven&apos;t been visited in 90+ days. Quick decisions only.</p>

      <div className="progress-track">
        <div className="progress-value" />
      </div>
      <p className="meta-text">4 of 12 done</p>

      <p className="warning-pill">Saved 94 days ago from Instagram</p>

      <div className="reason-card">
        <h3>Shape Up: Stop running in circles, ship work that matters</h3>
        <p className="meta-source">basecamp.com/shapeup</p>
        <p>
          Basecamp&apos;s full product methodology - appetite-based scoping, hill charts, and why sprints often create
          urgency traps.
        </p>

        <p className="section-label">What do you want to do with this?</p>
        <button type="button" className="decision-button">
          Keep it - still relevant to me
        </button>
        <button type="button" className="decision-button">
          Archive - maybe one day
        </button>
        <button type="button" className="decision-button decision-danger">
          Remove - no longer relevant
        </button>
      </div>
    </article>
  );
}

export function SearchScreen() {
  return (
    <article className="screen">
      <div className="search-shell">
        <span className="search-glyph">Q</span>
        <input type="text" value="career growth and levelling up" readOnly />
      </div>

      <p className="meta-text search-hint">Searching by meaning, not just keywords - 6 results</p>

      <div className="tag-row">
        <span className="tag-selected">career</span>
        <span>design</span>
        <span>productivity</span>
        <span>tech</span>
        <span>finance</span>
      </div>

      <p className="section-label">Best matches</p>
      <SearchResult
        title="Staff Design: navigating the IC career path"
        summary="Covers the full arc from senior to staff designer and what expectations shift at each level."
        match="strong match"
      />
      <SearchResult
        title="The difference between being busy and doing deep work"
        summary="Distinguishes reactive task completion from deliberate skill-building for long-term growth."
        match="strong match"
      />
      <SearchResult
        title="How to write a self-review that actually gets you promoted"
        summary="A tactical guide to framing impact and evidence so managers can clearly assess your growth."
        match="related"
      />
    </article>
  );
}

function Card({
  title,
  source,
  summary,
  badge,
}: {
  title: string;
  source: string;
  summary: string;
  badge: string;
}) {
  return (
    <article className="content-card">
      <div className="title-row">
        <h3>{title}</h3>
        <span className="status-pill">{badge}</span>
      </div>
      <p className="meta-source">{source} - saved recently</p>
      <p>{summary}</p>
      <div className="action-grid two-cols">
        <button type="button">Later</button>
        <button type="button">Read</button>
      </div>
    </article>
  );
}

function SearchResult({ title, summary, match }: { title: string; summary: string; match: string }) {
  return (
    <article className="content-card">
      <div className="title-row">
        <h3>{title}</h3>
        <span className="status-pill status-pill-info">{match}</span>
      </div>
      <p>{summary}</p>
      <p className="meta-source">saved from a connected account</p>
    </article>
  );
}
