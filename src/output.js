import Table from 'cli-table3';
import { writeFileSync } from 'node:fs';

/**
 * Format and output data based on global flags
 * @param {Record<string, unknown>[] | Record<string, unknown>} data
 * @param {{ json?: boolean, csv?: boolean, output?: string }} opts
 * @param {object} [metadata] - Optional report metadata for structured JSON output
 */
export function output(data, opts = {}, metadata) {
  let text;

  if (opts.json && metadata && Array.isArray(data)) {
    text = JSON.stringify({
      dimensions: metadata.dimensions || [],
      metrics: metadata.metrics || [],
      rows: data,
      rowCount: data.length,
      metadata: {
        dateRange: metadata.dateRange || null,
        compareRange: metadata.compareRange || null,
        property: metadata.property || null,
        filters: metadata.filters || [],
      },
    }, null, 2);
  } else if (opts.json) {
    text = JSON.stringify(data, null, 2);
  } else if (opts.csv) {
    text = toCsv(data);
  } else {
    text = toTable(data);
  }

  if (opts.output) {
    writeFileSync(opts.output, text);
    console.log(`Output written to ${opts.output}`);
  } else {
    console.log(text);
  }
}

/**
 * @param {Record<string, unknown>[] | Record<string, unknown>} data
 */
function toTable(data) {
  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) return 'No data';

  const keys = Object.keys(rows[0]);
  const table = new Table({ head: keys });

  for (const row of rows) {
    table.push(keys.map(k => String(row[k] ?? '')));
  }

  return table.toString();
}

/**
 * @param {Record<string, unknown>[] | Record<string, unknown>} data
 */
function toCsv(data) {
  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) return '';

  const keys = Object.keys(rows[0]);
  const header = keys.map(csvEscape).join(',');
  const lines = rows.map(row => keys.map(k => csvEscape(String(row[k] ?? ''))).join(','));

  return [header, ...lines].join('\n');
}

/** @param {string} val */
function csvEscape(val) {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
