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
  tags: string[];
}

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
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Analyze this content and provide enrichment data.

URL: ${url}
Title: ${metadata.title || 'Not available'}
Description: ${metadata.description || 'Not available'}

Please provide:
1. A concise 1-2 sentence summary of what this content is about
2. 3-5 relevant tags/categories (as a JSON array of strings)

Respond in this JSON format:
{
  "title": "A clear title for this link",
  "summary": "1-2 sentence summary",
  "tags": ["tag1", "tag2", "tag3"]
}

Only respond with the JSON, no other text.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const enriched = JSON.parse(content.text);
    return {
      title: enriched.title || metadata.title || url,
      summary: enriched.summary || metadata.description || '',
      tags: Array.isArray(enriched.tags) ? enriched.tags : [],
    };
  } catch (error) {
    console.error('Error enriching with Claude:', error);
    // Fallback to basic metadata
    return {
      title: metadata.title || url,
      summary: metadata.description || '',
      tags: [],
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
    const { url } = await request.json();

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

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Authenticated user: save to database
      const userId = session.user.id;

      const { data, error } = await supabase
        .from('links')
        .insert({
          user_id: userId,
          url,
          title: enriched.title,
          summary: enriched.summary,
          tags: enriched.tags,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving to Supabase:', error);
        return NextResponse.json(
          { error: 'Failed to save link' },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } else {
      // Guest user: return enriched data for client-side storage
      // Generate a temporary UUID-like ID for localStorage
      const id = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      return NextResponse.json({
        id,
        url,
        title: enriched.title,
        summary: enriched.summary,
        tags: enriched.tags,
        created_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in POST /api/save/link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
