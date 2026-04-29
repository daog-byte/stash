import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface EnrichmentResult {
  title: string;
  summary: string;
  tag: string;
  platform: string;
}

const VALID_TOPICS = new Set([
  'design',
  'tech',
  'career',
  'finance',
  'health',
  'culture',
  'productivity',
  'other',
]);

/**
 * Fetch metadata from a URL
 */
async function fetchMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  ogImage?: string;
}> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return {};

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Extract OG description or meta description
    const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
    const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    const description = ogDescMatch?.[1] || metaDescMatch?.[1];

    // Extract OG image
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    const ogImage = ogImageMatch?.[1];

    return { title, description, ogImage };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return {};
  }
}

/**
 * Enrich link with Claude AI
 */
async function enrichLinkWithClaude(
  url: string,
  metadata: { title?: string; description?: string }
): Promise<EnrichmentResult> {
  const hostname = new URL(url).hostname.replace(/^www\./, '');
  const safeTitle = metadata.title || hostname;
  const safeSummary = metadata.description || 'No summary available yet.';

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 24,
      messages: [
        {
          role: 'user',
          content: `Title: ${safeTitle}\nSummary: ${safeSummary}\n\nBased on this content, assign exactly one topic tag from this list: design, tech, career, finance, health, culture, productivity, other. Return only the tag word, nothing else.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const normalized = content.text.trim().toLowerCase();
    const parsedTag = VALID_TOPICS.has(normalized) ? normalized : 'other';

    return {
      title: safeTitle,
      summary: safeSummary,
      tag: parsedTag,
      platform: hostname,
    };
  } catch (error) {
    console.error('Error enriching with Claude:', error);

    return {
      title: safeTitle,
      summary: safeSummary,
      tag: 'other',
      platform: hostname,
    };
  }
}

/**
 * POST /api/save/link
 * Save and enrich a link
 * 
 * Supports both authenticated (saves to DB) and guest/unauthenticated (returns enriched data for client storage)
 */
export async function POST(request: NextRequest) {
  try {
    const { url, userId } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch metadata from URL
    const metadata = await fetchMetadata(url);

    // Enrich with Claude
    const enriched = await enrichLinkWithClaude(url, metadata);

    const guestPayload = {
      id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      url,
      title: enriched.title,
      summary: enriched.summary,
      tag: enriched.tag,
      tags: [enriched.tag],
      platform: enriched.platform,
      created_at: new Date().toISOString(),
      savedToDb: false,
    };

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(guestPayload);
    }

    const insertPayloads = [
      {
        user_id: userId,
        url,
        title: enriched.title,
        summary: enriched.summary,
        tag: enriched.tag,
        platform: enriched.platform,
        saved_at: new Date().toISOString(),
        read: false,
      },
      {
        user_id: userId,
        url,
        title: enriched.title,
        summary: enriched.summary,
        tag: enriched.tag,
        platform: enriched.platform,
      },
      {
        user_id: userId,
        url,
        title: enriched.title,
        summary: enriched.summary,
        tag: enriched.tag,
      },
      {
        user_id: userId,
        url,
        title: enriched.title,
        summary: enriched.summary,
      },
      {
        url,
        title: enriched.title,
        summary: enriched.summary,
        tag: enriched.tag,
      },
      {
        url,
        title: enriched.title,
        summary: enriched.summary,
      },
    ];

    let savedRow: Record<string, unknown> | null = null;
    let lastError = '';

    for (const payload of insertPayloads) {
      const { data, error } = await supabase.from('links').insert(payload).select().single();
      if (!error && data) {
        savedRow = data as Record<string, unknown>;
        break;
      }
      lastError = error?.message || '';
    }

    if (!savedRow) {
      console.error('Error saving to Supabase:', lastError);
      return NextResponse.json({ ...guestPayload, saveError: lastError });
    }

    return NextResponse.json({
      ...savedRow,
      tag: String(savedRow.tag || enriched.tag),
      tags: [String(savedRow.tag || enriched.tag)],
      savedToDb: true,
    });
  } catch (error) {
    console.error('Error in POST /api/save/link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
