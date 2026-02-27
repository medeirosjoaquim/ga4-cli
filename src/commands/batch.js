import { readFileSync } from 'node:fs';
import { getDataClient } from '../utils/client.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';
import { buildReportRequest, parseReportRows } from './report.js';

/** @param {import('commander').Command} program */
export function registerBatch(program) {
  program
    .command('batch <propertyId>')
    .description('Run multiple named report queries from JSON file or stdin')
    .option('--queries <file>', 'JSON file with array of query objects')
    .addHelpText('after', `
Reads query JSON from stdin by default, or from a file with --queries.

Query JSON format: [{ "name": "top-pages", "dimensions": "pagePath", "metrics": "sessions", "limit": "10", ... }]
Each query object supports: name, dimensions, metrics, start, end, compareStart, compareEnd, limit, orderBy, asc, filter (string or array), metricFilter (string or array).

Examples:
  $ echo '[{"name":"top-pages","dimensions":"pagePath","metrics":"sessions","limit":"10"}]' | analytics-cli batch 123 --json
  $ analytics-cli batch 123 --queries queries.json --json`)
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getDataClient();
      const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;

      let raw;
      if (opts.queries) {
        raw = readFileSync(opts.queries, 'utf8');
      } else {
        const chunks = [];
        for await (const chunk of process.stdin) chunks.push(chunk);
        raw = Buffer.concat(chunks).toString('utf8');
      }

      const queries = JSON.parse(raw);
      if (!Array.isArray(queries)) throw new Error('Queries must be a JSON array');

      const names = queries.map((q, i) => q.name || `query_${i}`);
      const requests = queries.map(q => buildReportRequest(property, q));

      // GA4 limits batchRunReports to 5 requests per call
      const results = {};
      for (let i = 0; i < requests.length; i += 5) {
        const chunk = requests.slice(i, i + 5);
        const chunkNames = names.slice(i, i + 5);
        const [response] = await client.batchRunReports({ property, requests: chunk });
        (response.reports || []).forEach((report, j) => {
          results[chunkNames[j]] = parseReportRows(report);
        });
      }

      output(results, cmd.optsWithGlobals());
    }));
}
