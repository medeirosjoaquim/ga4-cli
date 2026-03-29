import { getAdsCustomer } from '../utils/ads-client.js';
import { buildDateClause, formatAdsRows, buildAdsMetadata } from '../utils/gaql.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} ads */
export function registerAdsInsights(ads) {
  ads
    .command('schedule')
    .description('Hour-of-day and day-of-week performance')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--campaign <id>', 'Filter by campaign ID')
    .option('--by <segment>', 'Segment: hour or dow (day of week)', 'hour')
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

      const segment = opts.by === 'dow' ? 'segments.day_of_week' : 'segments.hour';
      const orderBy = opts.orderBy ? `ORDER BY ${opts.orderBy} DESC` : `ORDER BY ${segment} ASC`;

      const query = `
        SELECT
          ${segment},
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.conversions,
          metrics.cost_micros,
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
      output(data.length ? data : 'No schedule data', globalOpts, metadata);
    }));

  ads
    .command('daily')
    .description('Daily performance trend')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--campaign <id>', 'Filter by campaign ID')
    .option('--start <date>', 'Start date YYYY-MM-DD')
    .option('--end <date>', 'End date YYYY-MM-DD')
    .option('--during <period>', 'Predefined period')
    .option('--limit <n>', 'Row limit', '90')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);
      const dateClause = buildDateClause(opts);

      let where = `WHERE ${dateClause}`;
      if (opts.campaign) {
        where += ` AND campaign.id = ${opts.campaign}`;
      }

      const query = `
        SELECT
          segments.date,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.conversions,
          metrics.cost_micros,
          metrics.cost_per_conversion
        FROM campaign
        ${where}
        ORDER BY segments.date DESC
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No daily data', globalOpts, metadata);
    }));

  ads
    .command('impression-share')
    .description('Impression share and competitive metrics')
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

      const orderBy = opts.orderBy ? `ORDER BY ${opts.orderBy} DESC` : 'ORDER BY metrics.impressions DESC';

      const query = `
        SELECT
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.search_impression_share,
          metrics.search_top_impression_percentage,
          metrics.search_absolute_top_impression_percentage,
          metrics.search_budget_lost_impression_share,
          metrics.search_rank_lost_impression_share,
          metrics.content_impression_share,
          metrics.content_budget_lost_impression_share,
          metrics.content_rank_lost_impression_share
        FROM campaign
        ${where}
        ${orderBy}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No impression share data', globalOpts, metadata);
    }));

  ads
    .command('account-stats')
    .description('Account-level aggregate performance')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--start <date>', 'Start date YYYY-MM-DD')
    .option('--end <date>', 'End date YYYY-MM-DD')
    .option('--during <period>', 'Predefined period')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);
      const dateClause = buildDateClause(opts);

      const query = `
        SELECT
          customer.descriptive_name,
          customer.id,
          customer.currency_code,
          customer.time_zone,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.cost_micros,
          metrics.conversions,
          metrics.cost_per_conversion,
          metrics.all_conversions,
          metrics.all_conversions_value
        FROM customer
        WHERE ${dateClause}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No account data', globalOpts, metadata);
    }));

  ads
    .command('placements')
    .description('Display/YouTube placement performance')
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

      const orderBy = opts.orderBy ? `ORDER BY ${opts.orderBy} DESC` : 'ORDER BY metrics.impressions DESC';

      const query = `
        SELECT
          detail_placement_view.display_name,
          detail_placement_view.target_url,
          detail_placement_view.placement_type,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.conversions,
          metrics.cost_micros
        FROM detail_placement_view
        ${where}
        ${orderBy}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No placement data', globalOpts, metadata);
    }));
}
