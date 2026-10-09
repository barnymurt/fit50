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

// ---------------------------------------------------------------------------
// Submissions (Phase 4)
// ---------------------------------------------------------------------------

export interface SubmissionRow {
  id: string;
  member_id: string;
  type: 'progress' | 'book' | 'project';
  answers: any;
  photo_paths: string[];
  credit_as: 'full_name' | 'first_name' | 'anonymous';
  consent_scope: string;
  consent_at: string;
  withdrawn_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export async function listSubmissions(filter?: { status?: string; member_id?: string }): Promise<SubmissionRow[]> {
  let q = admin().from('content_submissions').select('*').order('created_at', { ascending: false });
  if (filter?.status) q = q.eq('status', filter.status);
  if (filter?.member_id) q = q.eq('member_id', filter.member_id);
  const { data, error } = await q;
  if (error) throw new Error(`listSubmissions: ${error.message}`);
  return (data || []) as SubmissionRow[];
}

export async function getSubmission(id: string): Promise<SubmissionRow | null> {
  const { data, error } = await admin().from('content_submissions').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`getSubmission: ${error.message}`);
  return data as SubmissionRow | null;
}

export async function createSubmission(input: {
  member_id: string;
  type: 'progress' | 'book' | 'project';
  answers: any;
  photo_paths?: string[];
  credit_as: 'full_name' | 'first_name' | 'anonymous';
  consent_scope: string;
  consent_at: string;
}): Promise<SubmissionRow> {
  const sb = admin();
  const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await sb.from('content_submissions').insert({
    id,
    member_id: input.member_id,
    type: input.type,
    answers: input.answers,
    photo_paths: input.photo_paths || [],
    credit_as: input.credit_as,
    consent_scope: input.consent_scope,
    consent_at: input.consent_at,
    status: 'pending',
  }).select('*').single();
  if (error) throw new Error(`createSubmission: ${error.message}`);
  return data as SubmissionRow;
}

export async function approveSubmission(
  id: string,
  opts: { generate_post: boolean; pillar?: 'member-progress' | 'books-members-read' | 'passion-projects' }
): Promise<{ submission: SubmissionRow; post: PostRow | null; version: VersionRow | null }> {
  const submission = await getSubmission(id);
  if (!submission) throw new Error('submission_not_found');
  const sb = admin();
  // Mark approved
  const { data: updated, error: updErr } = await sb.from('content_submissions').update({
    status: 'approved',
    updated_at: new Date().toISOString(),
  }).eq('id', id).select('*').single();
  if (updErr) throw new Error(`approveSubmission: ${updErr.message}`);

  let post: PostRow | null = null;
  let version: VersionRow | null = null;

  if (opts.generate_post && opts.pillar) {
    const result = await createPostFromSubmission(updated, opts.pillar);
    post = result.post;
    version = result.version;
  }

  return { submission: updated as SubmissionRow, post, version };
}

export async function rejectSubmission(id: string, note?: string): Promise<SubmissionRow> {
  const sb = admin();
  const { data, error } = await sb.from('content_submissions').update({
    status: 'rejected',
    updated_at: new Date().toISOString(),
  }).eq('id', id).select('*').single();
  if (error) throw new Error(`rejectSubmission: ${error.message}`);
  await sb.from('content_submissions').update({ updated_at: new Date().toISOString() }).eq('id', id); // no-op to ensure updated_at
  return data as SubmissionRow;
}

export async function withdrawSubmission(id: string): Promise<{ submission: SubmissionRow; flaggedPosts: string[] }> {
  const sb = admin();
  // Set withdrawn_at
  const { data: sub, error } = await sb.from('content_submissions').update({
    withdrawn_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', id).select('*').single();
  if (error) throw new Error(`withdrawSubmission: ${error.message}`);

  // Find every post using this submission and flag them
  const { data: posts, error: postErr } = await sb.from('content_posts')
    .select('id, current_version_id')
    .eq('submission_id', id);
  if (postErr) throw new Error(`withdrawSubmission posts: ${postErr.message}`);

  const flaggedPosts: string[] = [];
  for (const p of (posts || []) as any[]) {
    if (!p.current_version_id) continue;
    // Get current version, update checks.withdrawn, save a new version
    const { data: ver } = await sb.from('content_post_versions').select('*').eq('id', p.current_version_id).maybeSingle();
    if (!ver) continue;
    const doc = ver.doc || {};
    doc.checks = { ...(doc.checks || {}), withdrawn: true, withdrawn_at: new Date().toISOString() };
    // Save as a new version (preserves history)
    const { data: existing } = await sb.from('content_post_versions')
      .select('version').eq('post_id', p.id).order('version', { ascending: false }).limit(1);
    const nextVersion = (existing && existing[0]?.version) ? existing[0].version + 1 : 1;
    const { data: newVer } = await sb.from('content_post_versions').insert({
      post_id: p.id,
      version: nextVersion,
      doc,
      saved_by: 'human',
      note: `withdrawal of submission ${id}`,
    }).select('*').single();
    if (newVer) {
      await sb.from('content_posts').update({ current_version_id: newVer.id, updated_at: new Date().toISOString() }).eq('id', p.id);
      flaggedPosts.push(p.id);
    }
  }

  return { submission: sub as SubmissionRow, flaggedPosts };
}

// Build a stub post from a submission. The editor fleshes it
// out — the submission is the source of truth, but the
// generator / editor paint the slides.
async function createPostFromSubmission(
  submission: SubmissionRow,
  pillar: 'member-progress' | 'books-members-read' | 'passion-projects'
): Promise<{ post: PostRow; version: VersionRow }> {
  const id = `${submission.type}-${submission.id.slice(-8)}`;
  // Stub doc: cover with credit line, then 1–3 slides from
  // the answers, then a CTA. The editor will flesh this out.
  const coverLine = creditLineFor(submission, pillar);
  const doc = {
    id,
    type: 'carousel' as const,
    platform: 'instagram' as const,
    aspect: '4:5' as const,
    pillar,
    brief: `Member submission — ${submission.type}`,
    status: 'draft' as const,
    version: 1,
    marquee: 'marquee_default',
    source: { submission_id: submission.id, library: `libraries/submissions/${submission.type}.json` },
    slides: [
      { id: 's1', template: 'cover' as const, ground: 'ink' as const, fields: { headline: { text: coverLine, by: 'human' as const } } },
      { id: 's2', template: 'statement' as const, ground: 'paper' as const, fields: { body: { text: JSON.stringify(submission.answers).slice(0, 100), by: 'human' as const } } },
      { id: 's3', template: 'cta' as const, ground: 'paper' as const, fields: { headline: { text: 'Save this', by: 'human' as const }, button: { text: 'Read the rest', by: 'human' as const } } },
    ],
    caption: { text: `Member submission. ${coverLine}`, hashtags: [], by: 'human' as const },
    checks: {},
  };
  return await createPost({
    id,
    pillar,
    brief: `Member submission — ${submission.type}`,
    aspect: '4:5',
    platform: 'instagram',
    marquee: 'marquee_default',
    source: { submission_id: submission.id },
  });
}

function creditLineFor(submission: SubmissionRow, pillar: string): string {
  const a = submission.answers || {};
  if (pillar === 'member-progress') {
    const feeling = a.feeling ? ` — ${a.feeling}` : '';
    return `Member progress${feeling}`;
  }
  if (pillar === 'books-members-read') {
    return a.title ? `Read: ${a.title}` : 'Book pick';
  }
  if (pillar === 'passion-projects') {
    return a.title ? `Project: ${a.title}` : 'Passion project';
  }
  return 'Member submission';
}
