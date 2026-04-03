'use client';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');

  const handleStash = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // <--- Make sure the () are there!

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        setStatus('Success! Saved to Supabase.');
        setUrl('');
      } else {
        setStatus('Error stashing link.');
      }
    } catch (err) {
      setStatus('Network error.');
    }
  };

  return (
    <main style={{ padding: '50px' }}>
      <h1>Stash</h1>
      {/* PIECE 2: Tells the form to use our function instead of the default behavior */}
      <form onSubmit={handleStash}> 
        <input 
          type="url" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          placeholder="Paste link..."
          style={{ padding: '10px', marginRight: '10px' }}
        />
        <button type="submit">Stash</button>
      </form>
      {status && <p>{status}</p>}
    </main>
  );
}