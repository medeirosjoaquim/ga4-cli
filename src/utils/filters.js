/**
 * Parse a dimension filter expression.
 * Supported: field==val, field!=val, field contains val, field begins val,
 *            field ends val, field matches val, field in val1|val2|val3
 * @param {string} expr
 * @returns {object} GA4 filter expression
 */
export function parseDimensionFilter(expr) {
  // Operator map: symbol/keyword → GA4 matchType
  const ops = [
    { pattern: /^(\w+)\s*!=\s*(.+)$/, type: 'NOT_EXACT' },
    { pattern: /^(\w+)\s*==\s*(.+)$/, type: 'EXACT' },
    { pattern: /^(\w+)\s+contains\s+(.+)$/i, type: 'CONTAINS' },
    { pattern: /^(\w+)\s+begins\s+(.+)$/i, type: 'BEGINS_WITH' },
    { pattern: /^(\w+)\s+ends\s+(.+)$/i, type: 'ENDS_WITH' },
    { pattern: /^(\w+)\s+matches\s+(.+)$/i, type: 'FULL_REGEXP' },
  ];

  // Check "in" operator: field in val1|val2|val3
  const inMatch = expr.match(/^(\w+)\s+in\s+(.+)$/i);
  if (inMatch) {
    return {
      filter: {
        fieldName: inMatch[1],
        inListFilter: { values: inMatch[2].split('|').map(v => v.trim()) },
      },
    };
  }

  for (const { pattern, type } of ops) {
    const m = expr.match(pattern);
    if (m) {
      const matchType = type === 'NOT_EXACT' ? 'EXACT' : type;
      const filter = {
        fieldName: m[1],
        stringFilter: { value: m[2].trim(), matchType },
      };
      if (type === 'NOT_EXACT') {
        return { notExpression: { filter } };
      }
      return { filter };
    }
  }

  // Legacy ~= support
  const containsMatch = expr.match(/^(\w+)~=(.+)$/);
  if (containsMatch) {
    return {
      filter: {
        fieldName: containsMatch[1],
        stringFilter: { value: containsMatch[2], matchType: 'CONTAINS' },
      },
    };
  }

  throw new Error(
    `Unsupported filter: ${expr}\n` +
    'Syntax: field==val, field!=val, field contains val, field begins val, ' +
    'field ends val, field matches regex, field in val1|val2'
  );
}

/**
 * Parse a metric filter expression.
 * Supported: metric>N, metric<N, metric>=N, metric<=N, metric==N
 * @param {string} expr
 * @returns {object} GA4 metric filter expression
 */
export function parseMetricFilter(expr) {
  const ops = [
    { pattern: /^(\w+)\s*>=\s*(.+)$/, type: 'GREATER_THAN_OR_EQUAL' },
    { pattern: /^(\w+)\s*<=\s*(.+)$/, type: 'LESS_THAN_OR_EQUAL' },
    { pattern: /^(\w+)\s*>\s*(.+)$/, type: 'GREATER_THAN' },
    { pattern: /^(\w+)\s*<\s*(.+)$/, type: 'LESS_THAN' },
    { pattern: /^(\w+)\s*==\s*(.+)$/, type: 'EQUAL' },
  ];

  for (const { pattern, type } of ops) {
    const m = expr.match(pattern);
    if (m) {
      const val = Number(m[2].trim());
      if (Number.isNaN(val)) throw new Error(`Metric filter value must be a number: ${m[2]}`);
      return {
        filter: {
          fieldName: m[1],
          numericFilter: {
            operation: type,
            value: { int64Value: String(Math.trunc(val)) },
          },
        },
      };
    }
  }

  throw new Error(
    `Unsupported metric filter: ${expr}\nSyntax: metric>N, metric<N, metric>=N, metric<=N, metric==N`
  );
}

/**
 * Wrap an array of filter expressions in an andGroup (or return single unwrapped).
 * @param {object[]} expressions
 * @returns {object}
 */
export function wrapAndGroup(expressions) {
  if (expressions.length === 1) return expressions[0];
  return { andGroup: { expressions } };
}
