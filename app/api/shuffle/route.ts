import { NextRequest, NextResponse } from 'next/server';

interface ShuffleCandidate {
  id: string;
  title: string;
  url?: string;
  priority?: string | null;
  savedAt?: string;
  createdAt?: string;
  read?: boolean;
}

function getPriorityWeight(priority: string | null | undefined) {
  const normalized = (priority || '').toLowerCase();
  if (normalized.includes('urgent') || normalized.includes('high') || normalized === 'p1') return 4;
  if (normalized.includes('medium') || normalized === 'p2') return 2.5;
  if (normalized.includes('low') || normalized === 'p3') return 1.2;
  return 1.6;
}

function getAgeWeight(savedAt?: string) {
  if (!savedAt) return 1;
  const savedMs = new Date(savedAt).getTime();
  if (Number.isNaN(savedMs)) return 1;

  const ageDays = Math.max(0, Math.floor((Date.now() - savedMs) / (1000 * 60 * 60 * 24)));
  if (ageDays <= 7) return 1.2;
  if (ageDays <= 30) return 1.5;
  if (ageDays <= 90) return 2;
  return 2.6;
}

function computeWeight(candidate: ShuffleCandidate, includeRead: boolean) {
  if (candidate.read && !includeRead) return 0;
  const priorityWeight = getPriorityWeight(candidate.priority);
  const ageWeight = getAgeWeight(candidate.savedAt || candidate.createdAt);
  const readPenalty = candidate.read ? 0.35 : 1;

  return priorityWeight * ageWeight * readPenalty;
}

function pickWeighted(candidates: Array<ShuffleCandidate & { weight: number }>) {
  const total = candidates.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return null;

  let cursor = Math.random() * total;
  for (const item of candidates) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item;
    }
  }

  return candidates[candidates.length - 1] || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const links = Array.isArray(body.links) ? (body.links as ShuffleCandidate[]) : [];
    const excludeIds = Array.isArray(body.excludeIds) ? (body.excludeIds as string[]) : [];
    const includeRead = Boolean(body.includeRead);

    if (links.length === 0) {
      return NextResponse.json({ error: 'No links provided for shuffle.' }, { status: 400 });
    }

    const excluded = new Set(excludeIds);

    const eligible = links
      .filter((link) => link.id && !excluded.has(link.id))
      .map((link) => ({
        ...link,
        weight: computeWeight(link, includeRead),
      }))
      .filter((link) => link.weight > 0);

    if (eligible.length === 0) {
      return NextResponse.json({ selected: null, eligibleCount: 0 });
    }

    const selected = pickWeighted(eligible);

    return NextResponse.json({
      selected,
      eligibleCount: eligible.length,
      totalWeight: eligible.reduce((sum, item) => sum + item.weight, 0),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown shuffle error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}