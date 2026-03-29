import { getAdsCustomer } from '../utils/ads-client.js';
import { buildDateClause, formatAdsRows, buildAdsMetadata } from '../utils/gaql.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} ads */
export function registerAdsCampaigns(ads) {
  ads
    .command('campaigns')
    .description('List campaigns with performance metrics')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--status <status>', 'Filter by status (ENABLED, PAUSED, REMOVED)')
    .option('--start <date>', 'Start date YYYY-MM-DD')
    .option('--end <date>', 'End date YYYY-MM-DD')
    .option('--during <period>', 'Predefined period (e.g. LAST_30_DAYS, LAST_7_DAYS, THIS_MONTH)')
    .option('--order-by <field>', 'Order by field (e.g. metrics.clicks)')
    .option('--limit <n>', 'Row limit', '50')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);
      const dateClause = buildDateClause(opts);

      let where = `WHERE ${dateClause}`;
      if (opts.status) {
        where += ` AND campaign.status = '${opts.status.toUpperCase()}'`;
      }

      const orderBy = opts.orderBy ? `ORDER BY ${opts.orderBy} DESC` : 'ORDER BY metrics.clicks DESC';

      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.cost_micros,
          metrics.conversions,
          metrics.cost_per_conversion
        FROM campaign
        ${where}
        ${orderBy}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No campaign data', globalOpts, metadata);
    }));

  ads
    .command('adgroups')
    .description('List ad groups with performance metrics')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--campaign <id>', 'Filter by campaign ID')
    .option('--start <date>', 'Start date YYYY-MM-DD')
    .option('--end <date>', 'End date YYYY-MM-DD')
    .option('--during <period>', 'Predefined period')
    .option('--order-by <field>', 'Order by field')
    .option('--limit <n>', 'Row limit', '50')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);
      const dateClause = buildDateClause(opts);

      let where = `WHERE ${dateClause}`;
      if (opts.campaign) {
        where += ` AND campaign.id = ${opts.campaign}`;
      }

      const orderBy = opts.orderBy ? `ORDER BY ${opts.orderBy} DESC` : 'ORDER BY metrics.clicks DESC';

      const query = `
        SELECT
          ad_group.id,
          ad_group.name,
          ad_group.status,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.cost_micros,
          metrics.conversions
        FROM ad_group
        ${where}
        ${orderBy}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No ad group data', globalOpts, metadata);
    }));

  ads
    .command('ads')
    .description('List ads with performance metrics')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--campaign <id>', 'Filter by campaign ID')
    .option('--adgroup <id>', 'Filter by ad group ID')
    .option('--start <date>', 'Start date YYYY-MM-DD')
    .option('--end <date>', 'End date YYYY-MM-DD')
    .option('--during <period>', 'Predefined period')
    .option('--order-by <field>', 'Order by field')
    .option('--limit <n>', 'Row limit', '50')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);
      const dateClause = buildDateClause(opts);

      let where = `WHERE ${dateClause}`;
      if (opts.campaign) {
        where += ` AND campaign.id = ${opts.campaign}`;
      }
      if (opts.adgroup) {
        where += ` AND ad_group.id = ${opts.adgroup}`;
      }

      const orderBy = opts.orderBy ? `ORDER BY ${opts.orderBy} DESC` : 'ORDER BY metrics.clicks DESC';

      const query = `
        SELECT
          ad_group_ad.ad.id,
          ad_group_ad.ad.type,
          ad_group_ad.status,
          ad_group.name,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.conversions
        FROM ad_group_ad
        ${where}
        ${orderBy}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No ad data', globalOpts, metadata);
    }));
}
