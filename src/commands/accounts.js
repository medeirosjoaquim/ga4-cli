import { getAdminClient } from '../utils/client.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} program */
export function registerAccounts(program) {
  const accounts = program.command('accounts').description('Manage accounts');

  accounts
    .command('list')
    .description('List all accounts')
    .action(withErrorHandler(async (opts, cmd) => {
      const client = await getAdminClient();
      const [response] = await client.listAccounts();
      const data = response.map(a => ({
        name: a.name,
        displayName: a.displayName,
        createTime: a.createTime?.seconds ? new Date(Number(a.createTime.seconds) * 1000).toISOString() : '',
      }));
      output(data, cmd.optsWithGlobals());
    }));

  accounts
    .command('get <accountId>')
    .description('Get account details')
    .action(withErrorHandler(async (accountId, opts, cmd) => {
      const client = await getAdminClient();
      const name = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`;
      const [account] = await client.getAccount({ name });
      output({
        name: account.name,
        displayName: account.displayName,
        regionCode: account.regionCode,
        createTime: account.createTime?.seconds ? new Date(Number(account.createTime.seconds) * 1000).toISOString() : '',
        updateTime: account.updateTime?.seconds ? new Date(Number(account.updateTime.seconds) * 1000).toISOString() : '',
      }, cmd.optsWithGlobals());
    }));

  accounts
    .command('summary')
    .description('List all accounts with their properties')
    .action(withErrorHandler(async (opts, cmd) => {
      const client = await getAdminClient();
      const [response] = await client.listAccountSummaries();
      const data = response.map(s => ({
        account: s.name,
        displayName: s.displayName,
        properties: (s.propertySummaries || []).map(p => ({
          property: p.property,
          displayName: p.displayName,
        })),
      }));
      output(data, cmd.optsWithGlobals());
    }));

  accounts
    .command('change-history <accountId>')
    .description('Search change history events')
    .option('--property <id>', 'Filter by property ID')
    .option('--resource-type <type>', 'Filter by resource type (comma-separated)')
    .option('--action <action>', 'Filter by action (comma-separated: CREATED,UPDATED,DELETED)')
    .option('--start <date>', 'Earliest change time YYYY-MM-DD')
    .option('--end <date>', 'Latest change time YYYY-MM-DD')
    .option('--actor <email>', 'Filter by actor email')
    .option('--limit <n>', 'Max results', '50')
    .action(withErrorHandler(async (accountId, opts, cmd) => {
      const client = await getAdminClient();
      const account = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`;

      const request = { account, pageSize: parseInt(opts.limit, 10) };
      if (opts.property) {
        const prop = opts.property.startsWith('properties/') ? opts.property : `properties/${opts.property}`;
        request.property = prop;
      }
      if (opts.resourceType) {
        request.resourceType = opts.resourceType.split(',').map(s => s.trim());
      }
      if (opts.action) {
        request.action = opts.action.split(',').map(s => s.trim());
      }
      if (opts.start) {
        request.earliestChangeTime = { seconds: Math.floor(new Date(opts.start).getTime() / 1000) };
      }
      if (opts.end) {
        request.latestChangeTime = { seconds: Math.floor(new Date(opts.end).getTime() / 1000) };
      }
      if (opts.actor) {
        request.actorEmail = [opts.actor];
      }

      const [response] = await client.searchChangeHistoryEvents(request);
      const data = (response || []).map(e => ({
        id: e.id,
        changeTime: e.changeTime?.seconds ? new Date(Number(e.changeTime.seconds) * 1000).toISOString() : '',
        actorType: e.actorType,
        userActorEmail: e.userActorEmail,
        changesFiltered: e.changesFiltered,
        changes: (e.changes || []).map(c => ({
          resource: c.resource,
          action: c.action,
          resourceBeforeChange: c.resourceBeforeChange ? JSON.stringify(c.resourceBeforeChange) : '',
          resourceAfterChange: c.resourceAfterChange ? JSON.stringify(c.resourceAfterChange) : '',
        })),
      }));
      output(data, cmd.optsWithGlobals());
    }));

  accounts
    .command('access-report <accountId>')
    .description('Run an access report (who accessed data)')
    .option('--dimensions <dims>', 'Comma-separated dimensions (e.g. accessorEmail,accessMechanism)')
    .option('--metrics <metrics>', 'Comma-separated metrics (e.g. accessCount)')
    .option('--start <date>', 'Start date YYYY-MM-DD (default: 30daysAgo)')
    .option('--end <date>', 'End date YYYY-MM-DD (default: today)')
    .option('--limit <n>', 'Row limit', '100')
    .action(withErrorHandler(async (accountId, opts, cmd) => {
      const client = await getAdminClient();
      const entity = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`;

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
