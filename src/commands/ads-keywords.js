import { getAdsCustomer } from '../utils/ads-client.js';
import { buildDateClause, formatAdsRows, buildAdsMetadata } from '../utils/gaql.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} ads */
export function registerAdsKeywords(ads) {
  ads
    .command('keywords')
    .description('List keywords with performance metrics')
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
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          ad_group_criterion.status,
          ad_group.name,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.cost_micros,
          metrics.conversions,
          ad_group_criterion.quality_info.quality_score
        FROM keyword_view
        ${where}
        ${orderBy}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No keyword data', globalOpts, metadata);
    }));

  ads
    .command('search-terms')
    .description('List search terms with performance metrics')
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

      const orderBy = opts.orderBy ? `ORDER BY ${opts.orderBy} DESC` : 'ORDER BY metrics.impressions DESC';

      const query = `
        SELECT
          search_term_view.search_term,
          search_term_view.status,
          campaign.name,
          ad_group.name,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.cost_micros
        FROM search_term_view
        ${where}
        ${orderBy}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No search term data', globalOpts, metadata);
    }));
}
