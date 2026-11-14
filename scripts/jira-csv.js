// Minimal RFC-4180 CSV reader for the Jira export (handles quoted commas and duplicate headers).
const fs = require('fs');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1);
}

const MONTHS = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/** Parses Jira's "16/Oct/26 3:11 PM" into a Date (local time). */
function parseJiraDate(s) {
  const m = /^(\d{1,2})\/(\w{3})\/(\d{2}) (\d{1,2}):(\d{2}) (AM|PM)$/.exec((s || '').trim());
  if (!m) return null;
  let h = Number(m[4]) % 12;
  if (m[6] === 'PM') h += 12;
  return new Date(2000 + Number(m[3]), MONTHS[m[2]], Number(m[1]), h, Number(m[5]));
}

function loadIssues(file) {
  const [header, ...rows] = parseCsv(fs.readFileSync(file, 'utf8'));
  const idx = (name) => header.indexOf(name);
  const col = {
    summary: idx('Summary'),
    key: idx('Issue key'),
    type: idx('Issue Type'),
    status: idx('Status'),
    priority: idx('Priority'),
    assignee: idx('Assignee'),
    created: idx('Created'),
    resolved: idx('Resolved'),
    sprint: idx('Sprint'),
    points: idx('Custom field (Story point estimate)'),
    parentKey: idx('Parent key'),
    parentSummary: idx('Parent summary'),
    description: idx('Description'),
    statusChanged: idx('Status category changed'),
  };
  return rows.map((r) => ({
    key: r[col.key],
    summary: r[col.summary],
    type: r[col.type],
    status: r[col.status],
    priority: r[col.priority],
    assignee: r[col.assignee] || null,
    created: parseJiraDate(r[col.created]),
    resolved: parseJiraDate(r[col.resolved]),
    sprint: r[col.sprint] || null,
    points: r[col.points] ? Number(r[col.points]) : null,
    epicKey: r[col.parentKey] || null,
    epic: r[col.parentSummary] || null,
    description: r[col.description] || '',
  }));
}

module.exports = { parseCsv, parseJiraDate, loadIssues };
