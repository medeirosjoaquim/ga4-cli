import { readFileSync } from 'node:fs';
import { getDataClient } from '../utils/client.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';
import { parseDimensionFilter, parseMetricFilter, wrapAndGroup } from '../utils/filters.js';

/**
 * Parse report rows into flat objects
 * @param {object} response
 */
export function parseReportRows(response) {
  const dimHeaders = response.dimensionHeaders?.map(h => h.name) || [];
  const metricHeaders = response.metricHeaders?.map(h => h.name) || [];

  return (response.rows || []).map(row => {
    const obj = {};
    row.dimensionValues?.forEach((v, i) => { obj[dimHeaders[i]] = v.value; });
    row.metricValues?.forEach((v, i) => {
      const raw = v.value;
      const num = Number(raw);
      obj[metricHeaders[i]] = raw !== '' && !isNaN(num) ? num : raw;
    });
    return obj;
  });
}

/** Commander repeatable option collector */
function collect(val, arr) { arr.push(val); return arr; }

/**
 * Parse a pivot spec string into a GA4 pivot object.
 * Format: fieldNames:dim1,dim2;limit:N;orderBy:metric
 */
function parsePivotSpec(spec) {
  const pivot = {};
  for (const part of spec.split(';')) {
    const [key, ...rest] = part.split(':');
    const val = rest.join(':');
    if (key === 'fieldNames') {
      pivot.fieldNames = val.split(',').map(s => s.trim());
    } else if (key === 'limit') {
      pivot.limit = parseInt(val, 10);
    } else if (key === 'orderBy') {
      pivot.orderBys = [{ metric: { metricName: val } }];
    }
  }
  return pivot;
}

/**
 * Build a GA4 runReport request from a query object.
 * @param {string} property - GA4 property resource name
 * @param {object} q - Query parameters
 */
export function buildReportRequest(property, q) {
  const request = {
    property,
    dateRanges: [{
      startDate: q.start || '30daysAgo',
      endDate: q.end || 'today',
    }],
    limit: parseInt(q.limit || '100', 10),
  };

  if (q.compareStart && q.compareEnd) {
    request.dateRanges.push({
      startDate: q.compareStart,
      endDate: q.compareEnd,
    });
  }

  if (q.dimensions) {
    const dims = Array.isArray(q.dimensions) ? q.dimensions : q.dimensions.split(',');
    request.dimensions = dims.map(name => ({ name: name.trim() }));
  }
  if (q.metrics) {
    const mets = Array.isArray(q.metrics) ? q.metrics : q.metrics.split(',');
    request.metrics = mets.map(name => ({ name: name.trim() }));
  }

  if (q.orderBy) {
    request.orderBys = [{
      metric: { metricName: q.orderBy },
      desc: !q.asc,
    }];
  }

  // Dimension filters
  const dimFilters = q.filter || [];
  const dimExprs = (Array.isArray(dimFilters) ? dimFilters : [dimFilters]).map(parseDimensionFilter);
  if (dimExprs.length) request.dimensionFilter = wrapAndGroup(dimExprs);

  // Metric filters
  const metFilters = q.metricFilter || [];
  const metExprs = (Array.isArray(metFilters) ? metFilters : [metFilters]).map(parseMetricFilter);
  if (metExprs.length) request.metricFilter = wrapAndGroup(metExprs);

  return request;
}

/** @param {import('commander').Command} program */
export function registerReport(program) {
  const report = program.command('report').description('Run analytics reports');

  // Standard report
  report
    .command('run <propertyId>')
    .description('Run a standard GA4 report')
    .option('--dimensions <dims>', 'Comma-separated dimensions (e.g. city,deviceCategory)')
    .option('--metrics <metrics>', 'Comma-separated metrics (e.g. sessions,activeUsers)')
    .option('--start <date>', 'Start date YYYY-MM-DD (default: 30daysAgo)')
    .option('--end <date>', 'End date YYYY-MM-DD (default: today)')
    .option('--compare-start <date>', 'Comparison period start date')
    .option('--compare-end <date>', 'Comparison period end date')
    .option('--limit <n>', 'Row limit', '100')
    .option('--order-by <metric>', 'Sort by metric')
    .option('--asc', 'Ascending order (default is descending)')
    .option('--filter <expr>', 'Dimension filter (repeatable, AND logic)', collect, [])
    .option('--metric-filter <expr>', 'Metric filter (repeatable, AND logic)', collect, [])
    .addHelpText('after', `
Examples:
  $ analytics-cli report run 123 --dimensions city --metrics sessions --limit 10
  $ analytics-cli report run 123 --dimensions pagePath --metrics sessions --filter "pagePath contains /blog/" --filter "deviceCategory == mobile"
  $ analytics-cli report run 123 --metrics sessions --metric-filter "sessions > 100" --order-by sessions
  $ analytics-cli report run 123 --dimensions pagePath --metrics sessions --start 2025-01-01 --end 2025-01-31 --compare-start 2024-12-01 --compare-end 2024-12-31

Google Ads cost analysis (requires linked Google Ads account):
  $ analytics-cli report run 123 --dimensions sessionGoogleAdsCampaignName --metrics advertiserAdCost,conversions,returnOnAdSpend --order-by advertiserAdCost
  $ analytics-cli report run 123 --dimensions sessionGoogleAdsKeyword --metrics advertiserAdCost,advertiserAdCostPerConversion,sessions --metric-filter "advertiserAdCost > 0"`)
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getDataClient();
      const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;

      const request = buildReportRequest(property, opts);
      const [response] = await client.runReport(request);
      const data = parseReportRows(response);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = {
        dimensions: opts.dimensions ? opts.dimensions.split(',').map(s => s.trim()) : [],
        metrics: opts.metrics ? opts.metrics.split(',').map(s => s.trim()) : [],
        property,
        dateRange: { start: opts.start || '30daysAgo', end: opts.end || 'today' },
        compareRange: opts.compareStart ? { start: opts.compareStart, end: opts.compareEnd } : null,
        filters: [...(opts.filter || []), ...(opts.metricFilter || []).map(f => `[metric] ${f}`)],
      };

      output(data.length ? data : 'No data for the given parameters', globalOpts, metadata);
    }));

  // Batch report
  report
    .command('batch <propertyId>')
    .description('Run multiple named queries from a JSON file or stdin')
    .option('--queries <file>', 'JSON file with array of query objects')
    .option('--stdin', 'Read queries from stdin')
    .addHelpText('after', `
Query JSON format: [{ "name": "top-pages", "dimensions": "pagePath", "metrics": "sessions", "limit": "10", ... }]
Each query object supports the same fields as 'report run' flags (dimensions, metrics, start, end, compareStart, compareEnd, limit, orderBy, asc, filter, metricFilter).`)
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getDataClient();
      const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;

      let raw;
      if (opts.stdin) {
        const chunks = [];
        for await (const chunk of process.stdin) chunks.push(chunk);
        raw = Buffer.concat(chunks).toString('utf8');
      } else if (opts.queries) {
        raw = readFileSync(opts.queries, 'utf8');
      } else {
        throw new Error('Provide --queries <file> or --stdin');
      }

      const queries = JSON.parse(raw);
      if (!Array.isArray(queries)) throw new Error('Queries must be a JSON array');

      const names = queries.map((q, i) => q.name || `query_${i}`);
      const requests = queries.map(q => buildReportRequest(property, q));

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

  // Pivot report
  report
    .command('pivot <propertyId>')
    .description('Run a pivot report')
    .option('--dimensions <dims>', 'Comma-separated dimensions')
    .option('--metrics <metrics>', 'Comma-separated metrics')
    .option('--pivots <spec>', 'Pivot spec: fieldNames:dim1,dim2;limit:N;orderBy:metric (repeatable)', collect, [])
    .option('--start <date>', 'Start date YYYY-MM-DD (default: 30daysAgo)')
    .option('--end <date>', 'End date YYYY-MM-DD (default: today)')
    .option('--limit <n>', 'Row limit', '100')
    .addHelpText('after', `
Pivot spec format: fieldNames:dim1,dim2;limit:5;orderBy:metricName
Multiple pivots can be specified by repeating --pivots.

Examples:
  $ analytics-cli report pivot 123 --dimensions country,deviceCategory --metrics sessions --pivots "fieldNames:deviceCategory;limit:3"
  $ analytics-cli report pivot 123 --dimensions browser,country --metrics sessions,activeUsers --pivots "fieldNames:browser;limit:5;orderBy:sessions"`)
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getDataClient();
      const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;

      const request = {
        property,
        dateRanges: [{ startDate: opts.start || '30daysAgo', endDate: opts.end || 'today' }],
        limit: parseInt(opts.limit || '100', 10),
      };

      if (opts.dimensions) {
        request.dimensions = opts.dimensions.split(',').map(name => ({ name: name.trim() }));
      }
      if (opts.metrics) {
        request.metrics = opts.metrics.split(',').map(name => ({ name: name.trim() }));
      }

      request.pivots = opts.pivots.map(parsePivotSpec);

      const [response] = await client.runPivotReport(request);
      const data = parseReportRows(response);
      output(data.length ? data : 'No pivot data', cmd.optsWithGlobals());
    }));

  // Realtime report
  report
    .command('realtime <propertyId>')
    .description('Real-time report')
    .option('--dimensions <dims>', 'Comma-separated dimensions')
    .option('--metrics <metrics>', 'Comma-separated metrics')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getDataClient();
      const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;

      const request = { property };
      if (opts.dimensions) {
        request.dimensions = opts.dimensions.split(',').map(name => ({ name: name.trim() }));
      }
      if (opts.metrics) {
        request.metrics = opts.metrics.split(',').map(name => ({ name: name.trim() }));
      }

      const [response] = await client.runRealtimeReport(request);
      const data = parseReportRows(response);
      output(data.length ? data : 'No realtime data', cmd.optsWithGlobals());
    }));

  // Cohort report
  report
    .command('cohort <propertyId>')
    .description('Cohort analysis')
    .option('--cohort-dimension <dim>', 'Cohort dimension (default: firstSessionDate)')
    .option('--date-ranges <ranges>', 'Date ranges as start:end,start:end')
    .option('--metrics <metrics>', 'Comma-separated metrics')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getDataClient();
      const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;

      const cohorts = [];
      if (opts.dateRanges) {
        opts.dateRanges.split(',').forEach((range, i) => {
          const [start, end] = range.split(':');
          cohorts.push({ name: `cohort_${i}`, dimension: opts.cohortDimension || 'firstSessionDate', dateRange: { startDate: start, endDate: end } });
        });
      }

      const request = {
        property,
        cohortSpec: {
          cohorts,
          cohortsRange: { granularity: 'DAILY', endOffset: 5 },
        },
      };

      if (opts.metrics) {
        request.metrics = opts.metrics.split(',').map(name => ({ name: name.trim() }));
      }

      const [response] = await client.runReport(request);
      const data = parseReportRows(response);
      output(data.length ? data : 'No cohort data', cmd.optsWithGlobals());
    }));

  // Funnel report
  report
    .command('funnel <propertyId>')
    .description('Funnel report')
    .option('--steps <steps>', 'Funnel steps as name:filter,name:filter')
    .option('--dimensions <dims>', 'Comma-separated dimensions')
    .option('--start <date>', 'Start date YYYY-MM-DD')
    .option('--end <date>', 'End date YYYY-MM-DD')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getDataClient();
      const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;

      const steps = [];
      if (opts.steps) {
        for (const step of opts.steps.split(',')) {
          const colonIdx = step.indexOf(':');
          const name = step.slice(0, colonIdx);
          const filterExpr = step.slice(colonIdx + 1);
          steps.push({
            name,
            filterExpression: {
              andGroup: {
                expressions: [{
                  filter: {
                    fieldName: 'eventName',
                    stringFilter: { value: filterExpr, matchType: 'EXACT' },
                  },
                }],
              },
            },
          });
        }
      }

      const request = {
        property,
        funnel: { steps },
      };

      if (opts.start || opts.end) {
        request.dateRanges = [{ startDate: opts.start || '30daysAgo', endDate: opts.end || 'today' }];
      }
      if (opts.dimensions) {
        request.funnelBreakdown = {
          breakdownDimension: { name: opts.dimensions.split(',')[0].trim() },
        };
      }

      const [response] = await client.runFunnelReport(request);
      const rows = response.funnelTable?.rows || [];
      const data = rows.map(row => {
        const obj = {};
        row.dimensionValues?.forEach((v, i) => {
          obj[response.funnelTable.dimensionHeaders[i]?.name || `dim_${i}`] = v.value;
        });
        row.metricValues?.forEach((v, i) => {
          obj[response.funnelTable.metricHeaders[i]?.name || `metric_${i}`] = v.value;
        });
        return obj;
      });
      output(data.length ? data : 'No funnel data', cmd.optsWithGlobals());
    }));
}
