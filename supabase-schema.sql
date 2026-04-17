-- Supabase SQL Schema Setup for STASH
-- Run these SQL commands in the Supabase SQL Editor to set up the required tables

-- Create links table
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_tags ON links USING GIN(tags);

-- Enable Row Level Security (RLS) for links table
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own links
CREATE POLICY "Users can view their own links" ON links
  FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policy: Users can insert their own links
CREATE POLICY "Users can insert their own links" ON links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can update their own links
CREATE POLICY "Users can update their own links" ON links
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policy: Users can delete their own links
CREATE POLICY "Users can delete their own links" ON links
  FOR DELETE USING (auth.uid() = user_id);

-- Create user_connections table (for X/Twitter OAuth tokens)
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);

ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections" ON user_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections" ON user_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" ON user_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" ON user_connections
  FOR DELETE USING (auth.uid() = user_id);
