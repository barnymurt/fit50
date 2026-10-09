// ce-helpers.ts — shared helpers for the content engine API
// routes. Loads posts, saves versions, applies the field-lock
// mutation. All routes use the service-role Supabase client.

import { createAdminClient } from './supabase-admin';
import { Post } from '@/ce-content-engine/schema/post';
import { loadTokens } from '@/ce-content-engine/tokens';
import { runAllChecks } from '@/ce-content-engine/checks/index';

export interface PostRow {
  id: string;
  current_version_id: string | null;
  pillar: string;
  status: string;
  brief: string | null;
  aspect: string;
  platform: string;
  marquee: string | null;
  source: any;
  last_rendered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VersionRow {
  id: string;
  post_id: string;
  version: number;
  doc: any;
  saved_by: string;
  note: string | null;
  created_at: string;
}

function admin() {
  return createAdminClient() as any;
}

export async function listPosts(filter?: { status?: string }): Promise<PostRow[]> {
  let q = admin().from('content_posts').select('*').order('updated_at', { ascending: false });
  if (filter?.status) q = q.eq('status', filter.status);
  const { data, error } = await q;
  if (error) throw new Error(`listPosts: ${error.message}`);
  return (data || []) as PostRow[];
}

export async function getPost(id: string): Promise<{ post: PostRow; version: VersionRow | null } | null> {
  const { data: post, error } = await admin().from('content_posts').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`getPost: ${error.message}`);
  if (!post) return null;
  const { data: ver } = await admin().from('content_post_versions').select('*').eq('id', (post as PostRow).current_version_id).maybeSingle();
  return { post: post as PostRow, version: ver as VersionRow | null };
}

export async function getVersionById(id: string): Promise<VersionRow | null> {
  const { data, error } = await admin().from('content_post_versions').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`getVersionById: ${error.message}`);
  return data as VersionRow | null;
}

export async function getVersions(postId: string): Promise<VersionRow[]> {
  const { data, error } = await admin().from('content_post_versions').select('*').eq('post_id', postId).order('version', { ascending: false });
  if (error) throw new Error(`getVersions: ${error.message}`);
  return (data || []) as VersionRow[];
}

export interface SaveResult {
  version: VersionRow;
  post: PostRow;
  flags: Array<{ slideId?: string; field?: string; message: string }>;
}

export async function saveNewVersion(
  postId: string,
  doc: unknown,
  opts: { savedBy: string; note?: string }
): Promise<SaveResult> {
  // Validate against the Zod schema
  const parsed = Post.safeParse(doc);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new Error(`Schema failed: ${issues.join('; ')}`);
  }
  const post = parsed.data;

  // Run all checks
  const tokens = await loadTokens();
  const flags = await runAllChecks(post, tokens);

  // Find the next version number
  const existing = await getVersions(postId);
  const nextVersion = existing.length === 0 ? 1 : Math.max(...existing.map((v) => v.version)) + 1;

  const sb = admin();
  const { data: ver, error: verErr } = await sb
    .from('content_post_versions')
    .insert({
      post_id: postId,
      version: nextVersion,
      doc: post,
      saved_by: opts.savedBy,
      note: opts.note || null,
    })
    .select('*')
    .single();
  if (verErr) throw new Error(`saveNewVersion insert: ${verErr.message}`);

  // Update the post to point at the new version
  const { data: postRow, error: postErr } = await sb
    .from('content_posts')
    .update({
      current_version_id: ver.id,
      pillar: post.pillar,
      status: post.status,
      brief: post.brief || null,
      aspect: post.aspect,
      platform: post.platform,
      marquee: post.marquee || null,
      source: post.source || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select('*')
    .single();
  if (postErr) throw new Error(`saveNewVersion update post: ${postErr.message}`);

  return { version: ver as VersionRow, post: postRow as PostRow, flags };
}

export async function createPost(input: {
  pillar: string;
  brief?: string;
  aspect?: string;
  platform?: string;
  marquee?: string;
  source?: any;
  id?: string;
}): Promise<{ post: PostRow; version: VersionRow }> {
  const sb = admin();
  const id = input.id || `post-${Date.now()}`;
  // Build a minimal-but-valid initial doc. Empty slides fail
  // the schema's min(3), so we seed three slides.
  const initialDoc: any = {
    id,
    type: 'carousel',
    platform: input.platform || 'instagram',
    aspect: input.aspect || '4:5',
    pillar: input.pillar,
    brief: input.brief || '',
    status: 'draft',
    version: 1,
    marquee: input.marquee || 'marquee_default',
    source: input.source || {},
    slides: [
      { id: 's1', template: 'cover', ground: 'ink', fields: { headline: { text: 'New post', by: 'human' } } },
      { id: 's2', template: 'statement', ground: 'paper', fields: {} },
      { id: 's3', template: 'cta', ground: 'paper', fields: { headline: { text: 'Save this', by: 'human' } } },
    ],
    caption: { text: '', hashtags: [], by: 'ai' },
    checks: {},
  };

  const doc = initialDoc;
  const { data: post, error: postErr } = await sb.from('content_posts').insert({
    id,
    pillar: input.pillar,
    status: 'draft',
    brief: input.brief || null,
    aspect: input.aspect || '4:5',
    platform: input.platform || 'instagram',
    marquee: input.marquee || null,
    source: input.source || null,
  }).select('*').single();
  if (postErr) throw new Error(`createPost: ${postErr.message}`);

  const { data: ver, error: verErr } = await sb.from('content_post_versions').insert({
    post_id: id,
    version: 1,
    doc,
    saved_by: 'human',
    note: 'initial draft',
  }).select('*').single();
  if (verErr) throw new Error(`createPost version: ${verErr.message}`);

  await sb.from('content_posts').update({ current_version_id: ver.id }).eq('id', id);

  return { post: post as PostRow, version: ver as VersionRow };
}

export async function logGeneration(entry: {
  post_id?: string | null;
  kind: string;
  model: string;
  pillar?: string | null;
  tokens_in?: number;
  tokens_out?: number;
  est_cost_usd?: number;
  passed_checks?: boolean | null;
  elapsed_ms?: number;
  notes?: string | null;
}) {
  await admin().from('content_generations').insert({
    post_id: entry.post_id || null,
    kind: entry.kind,
    model: entry.model,
    pillar: entry.pillar || null,
    tokens_in: entry.tokens_in || 0,
    tokens_out: entry.tokens_out || 0,
    est_cost_usd: entry.est_cost_usd || 0,
    passed_checks: entry.passed_checks ?? null,
    elapsed_ms: entry.elapsed_ms || 0,
    notes: entry.notes || null,
  });
}

export async function logCorrection(entry: {
  post_id: string;
  version_id?: string | null;
  field_path: string;
  pillar?: string | null;
  before: any;
  after: any;
  reason?: string | null;
}) {
  await admin().from('content_corrections').insert({
    post_id: entry.post_id,
    version_id: entry.version_id || null,
    field_path: entry.field_path,
    pillar: entry.pillar || null,
    before: entry.before,
    after: entry.after,
    reason: entry.reason || null,
  });
}
