import { getAdminClient } from '../utils/client.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} program */
export function registerProperties(program) {
  const properties = program.command('properties').description('Manage properties');

  properties
    .command('list <accountId>')
    .description('List properties for an account')
    .action(withErrorHandler(async (accountId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`;
      const [response] = await client.listProperties({ filter: `parent:${parent}` });
      const data = response.map(p => ({
        name: p.name,
        displayName: p.displayName,
        timeZone: p.timeZone,
        currencyCode: p.currencyCode,
        industryCategory: p.industryCategory,
      }));
      output(data, cmd.optsWithGlobals());
    }));

  properties
    .command('get <propertyId>')
    .description('Get property details')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const name = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [property] = await client.getProperty({ name });
      output({
        name: property.name,
        displayName: property.displayName,
        timeZone: property.timeZone,
        currencyCode: property.currencyCode,
        industryCategory: property.industryCategory,
        serviceLevel: property.serviceLevel,
        createTime: property.createTime?.seconds ? new Date(Number(property.createTime.seconds) * 1000).toISOString() : '',
        updateTime: property.updateTime?.seconds ? new Date(Number(property.updateTime.seconds) * 1000).toISOString() : '',
      }, cmd.optsWithGlobals());
    }));

  properties
    .command('access-report <propertyId>')
    .description('Run an access report (who accessed data)')
    .option('--dimensions <dims>', 'Comma-separated dimensions (e.g. accessorEmail,accessMechanism)')
    .option('--metrics <metrics>', 'Comma-separated metrics (e.g. accessCount)')
    .option('--start <date>', 'Start date YYYY-MM-DD (default: 30daysAgo)')
    .option('--end <date>', 'End date YYYY-MM-DD (default: today)')
    .option('--limit <n>', 'Row limit', '100')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const entity = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;

      const request = {
        entity,
        dateRanges: [{ startDate: opts.start || '30daysAgo', endDate: opts.end || 'today' }],
        limit: parseInt(opts.limit, 10),
      };
      if (opts.dimensions) {
        request.dimensions = opts.dimensions.split(',').map(name => ({ dimensionName: name.trim() }));
      }
      if (opts.metrics) {
        request.metrics = opts.metrics.split(',').map(name => ({ metricName: name.trim() }));
      }

      const [response] = await client.runAccessReport(request);
      const dimHeaders = response.dimensionHeaders?.map(h => h.dimensionName) || [];
      const metricHeaders = response.metricHeaders?.map(h => h.metricName) || [];
      const data = (response.rows || []).map(row => {
        const obj = {};
        row.dimensionValues?.forEach((v, i) => { obj[dimHeaders[i]] = v.value; });
        row.metricValues?.forEach((v, i) => {
          const raw = v.value;
          const num = Number(raw);
          obj[metricHeaders[i]] = raw !== '' && !isNaN(num) ? num : raw;
        });
        return obj;
      });
      output(data.length ? data : 'No access data', cmd.optsWithGlobals());
    }));
}
