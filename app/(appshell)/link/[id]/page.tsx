import Link from 'next/link';

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <section className="stash-card">
        <h3>Selected Link</h3>
        <p style={{ marginTop: 10 }}>
          Link id: <span className="stash-kbd">{id}</span>
        </p>
        <p style={{ marginTop: 6, color: '#6a6158' }}>
          This screen maps to the IA for title/domain, saved metadata, AI summary, tags, and related saves.
        </p>
      </section>

      <section className="stash-grid">
        <article className="stash-card">
          <h3>Displays</h3>
          <ul className="stash-list">
            <li>Title and domain</li>
            <li>Platform badge and date saved</li>
            <li>Priority tier</li>
            <li>Why you saved this - AI summary</li>
            <li>Auto-tags and related saves</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Commands</h3>
          <ul className="stash-list">
            <li>Read full article</li>
            <li>Share</li>
            <li>Save again</li>
            <li>Archive</li>
            <li><Link href="/home">Back to home</Link></li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Options</h3>
          <ul className="stash-list">
            <li>Edit priority tier</li>
            <li>Edit tags manually</li>
            <li>Copy link</li>
          </ul>
        </article>
      </section>
    </>
  );
}
