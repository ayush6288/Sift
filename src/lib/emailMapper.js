import { initialEmails } from '../data/mockEmails';

export const CATEGORY_BY_FOLDER = {
  action: 'Action Required',
  receipts: 'Receipts',
  newsletters: 'Newsletters',
  archive: 'Archive',
};

export const FOLDER_BY_CATEGORY = {
  'Action Required': 'action',
  Receipts: 'receipts',
  Newsletters: 'newsletters',
  Archive: 'archive',
};

const VALID_PRIORITIES = new Set(['High', 'Medium', 'Low']);
const AVATAR_TONES = ['sage', 'sky', 'rose', 'sand', 'clay', 'lilac', 'slate'];

export function folderToCategory(folderId) {
  return CATEGORY_BY_FOLDER[folderId] ?? 'Archive';
}

function toneFor(value = '') {
  const total = [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return AVATAR_TONES[total % AVATAR_TONES.length];
}

function parseSender(rawSender = '') {
  const sender = String(rawSender).trim();
  const match = sender.match(/^\s*"?([^"<]+?)"?\s*<([^>]+)>\s*$/);

  if (match) {
    const name = match[1].trim();
    const email = match[2].trim();
    return { name: name || email.split('@')[0], email, tone: toneFor(name || email) };
  }

  if (sender.includes('@')) {
    return {
      name: sender.split('@')[0].replace(/[._-]+/g, ' '),
      email: sender,
      tone: toneFor(sender),
    };
  }

  return { name: sender || 'Unknown sender', email: '', tone: toneFor(sender) };
}

function splitSummary(summary = '') {
  const text = String(summary).trim();
  if (!text) return ['Sift has not summarized this email yet.'];

  // Intl.Segmenter keeps decimals like "$4,800.00" inside one sentence.
  const sentenceSegmenter =
    typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
      ? new Intl.Segmenter('en', { granularity: 'sentence' })
      : null;

  const sentences = sentenceSegmenter
    ? [...sentenceSegmenter.segment(text)].map((part) => part.segment.trim())
    : [text];

  return sentences.filter(Boolean).slice(0, 3);
}

function splitBody(body = '') {
  const paragraphs = String(body)
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.length > 0 ? paragraphs : [''];
}

function buildSnippet(summary, body) {
  const source =
    summary[0] ??
    String(body)
      .replace(/\s+/g, ' ')
      .trim();

  if (!source) return 'No preview available.';
  return source.length > 170 ? `${source.slice(0, 167).trimEnd()}…` : source;
}

export function mapEmailRow(row) {
  if (!row?.id) return null;

  const category = FOLDER_BY_CATEGORY[row.category] ? row.category : 'Archive';
  const priority = VALID_PRIORITIES.has(row.priority) ? row.priority : 'Medium';
  const summary = splitSummary(row.ai_summary);
  const body = splitBody(row.body);
  const sender = parseSender(row.sender);
  const createdAt = Date.parse(row.created_at);

  return {
    id: String(row.id),
    sender,
    subject: row.subject?.trim() || '(No subject)',
    snippet: buildSnippet(summary, row.body),
    receivedAt: Number.isNaN(createdAt) ? Date.now() : createdAt,
    folder: FOLDER_BY_CATEGORY[category],
    category,
    priority,
    highPriority: priority === 'High',
    unread: false,
    starred: false,
    handled: Boolean(row.is_handled),
    tags: [category],
    summary,
    actionItem: row.action_item?.trim() || 'No action needed.',
    body,
    attachments: [],
  };
}

export function mapEmailRows(rows = []) {
  return rows.map(mapEmailRow).filter(Boolean);
}

export function buildSeedRows() {
  return initialEmails.map((email) => ({
    sender: email.sender.email
      ? `${email.sender.name} <${email.sender.email}>`
      : email.sender.name,
    subject: email.subject,
    body: email.body.join('\n\n'),
    category: folderToCategory(email.folder),
    priority: email.highPriority
      ? 'High'
      : email.folder === 'action'
        ? 'Medium'
        : 'Low',
    ai_summary: email.summary.join(' '),
    action_item: email.actionItem,
    is_handled: Boolean(email.handled),
    created_at: new Date(email.receivedAt).toISOString(),
  }));
}
