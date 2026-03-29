import { getAdsCustomer } from '../utils/ads-client.js';
import { buildDateClause, formatAdsRows, buildAdsMetadata } from '../utils/gaql.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} ads */
export function registerAdsOptimization(ads) {
  ads
    .command('bid-strategies')
    .description('Bid strategy performance')
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
          campaign.bidding_strategy_type,
          campaign.bidding_strategy,
          campaign_budget.amount_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.cost_micros,
          metrics.conversions,
          metrics.cost_per_conversion
        FROM campaign
        WHERE ${dateClause} AND campaign.status = 'ENABLED'
        ORDER BY metrics.cost_micros DESC
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No bid strategy data', globalOpts, metadata);
    }));

  ads
    .command('negative-keywords')
    .description('List negative keywords')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--campaign <id>', 'Filter by campaign ID')
    .option('--level <level>', 'Level: campaign or adgroup', 'campaign')
    .option('--limit <n>', 'Row limit', '100')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);

      let query;
      if (opts.level === 'adgroup') {
        let where = `WHERE ad_group_criterion.negative = TRUE`;
        if (opts.campaign) {
          where += ` AND campaign.id = ${opts.campaign}`;
        }

        query = `
          SELECT
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            ad_group.name,
            campaign.name
          FROM ad_group_criterion
          ${where}
          LIMIT ${opts.limit}
        `;
      } else {
        let where = `WHERE campaign_criterion.negative = TRUE`;
        if (opts.campaign) {
          where += ` AND campaign.id = ${opts.campaign}`;
        }

        query = `
          SELECT
            campaign_criterion.keyword.text,
            campaign_criterion.keyword.match_type,
            campaign.name
          FROM campaign_criterion
          ${where}
          LIMIT ${opts.limit}
        `;
      }

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default');
      output(data.length ? data : 'No negative keywords found', globalOpts, metadata);
    }));

  ads
    .command('ad-strength')
    .description('Responsive search ad strength ratings')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--campaign <id>', 'Filter by campaign ID')
    .option('--adgroup <id>', 'Filter by ad group ID')
    .option('--start <date>', 'Start date YYYY-MM-DD')
    .option('--end <date>', 'End date YYYY-MM-DD')
    .option('--during <period>', 'Predefined period')
    .option('--limit <n>', 'Row limit', '50')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);
      const dateClause = buildDateClause(opts);

      let where = `WHERE ${dateClause} AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'`;
      if (opts.campaign) {
        where += ` AND campaign.id = ${opts.campaign}`;
      }
      if (opts.adgroup) {
        where += ` AND ad_group.id = ${opts.adgroup}`;
      }

      const query = `
        SELECT
          ad_group_ad.ad.id,
          ad_group_ad.ad.responsive_search_ad.ad_strength,
          ad_group_ad.ad.final_urls,
          ad_group_ad.status,
          ad_group.name,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.conversions,
          metrics.cost_micros
        FROM ad_group_ad
        ${where}
        ORDER BY metrics.impressions DESC
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No RSA ad strength data', globalOpts, metadata);
    }));
}
