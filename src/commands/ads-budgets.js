import { getAdsCustomer } from '../utils/ads-client.js';
import { buildDateClause, formatAdsRows, buildAdsMetadata } from '../utils/gaql.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} ads */
export function registerAdsBudgets(ads) {
  ads
    .command('budgets')
    .description('Campaign budget report')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--start <date>', 'Start date YYYY-MM-DD')
    .option('--end <date>', 'End date YYYY-MM-DD')
    .option('--during <period>', 'Predefined period')
    .option('--limit <n>', 'Row limit', '50')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);
      const dateClause = buildDateClause(opts);

      const query = `
        SELECT
          campaign.name,
          campaign.status,
          campaign_budget.amount_micros,
          campaign_budget.delivery_method,
          campaign_budget.status,
          metrics.cost_micros,
          metrics.clicks,
          metrics.impressions
        FROM campaign
        WHERE ${dateClause}
        ORDER BY metrics.cost_micros DESC
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No budget data', globalOpts, metadata);
    }));
}
