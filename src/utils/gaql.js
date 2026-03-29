/**
 * Build a GAQL date clause from command options
 * @param {{ start?: string, end?: string, during?: string }} opts
 * @returns {string}
 */
export function buildDateClause(opts) {
  if (opts.during) {
    return `segments.date DURING ${opts.during}`;
  }
  if (opts.start && opts.end) {
    return `segments.date BETWEEN '${opts.start}' AND '${opts.end}'`;
  }
  return 'segments.date DURING LAST_30_DAYS';
}

/**
 * Flatten nested GAQL response rows into flat objects.
 * Converts cost_micros fields to cost (÷1,000,000).
 * @param {object[]} rows
 * @returns {object[]}
 */
export function formatAdsRows(rows) {
  return rows.map(row => {
    const flat = {};
    flatten(row, '', flat);
    return flat;
  });
}

/**
 * Recursively flatten a nested object
 * @param {object} obj
 * @param {string} prefix
 * @param {object} result
 */
function flatten(obj, prefix, result) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}_${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, fullKey, result);
    } else if (key.endsWith('_micros') || key === 'cost_micros') {
      const costKey = fullKey.replace(/_micros$/, '');
      result[costKey] = (Number(value) / 1_000_000).toFixed(2);
    } else {
      result[fullKey] = value;
    }
  }
}

/**
 * Build metadata object for JSON output
 * @param {string} query
 * @param {string} customerId
 * @param {string} dateRange
 * @returns {object}
 */
export function buildAdsMetadata(query, customerId, dateRange) {
  return {
    query,
    customerId,
    dateRange,
    source: 'google-ads',
  };
}
