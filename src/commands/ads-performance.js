import { getAdsCustomer } from '../utils/ads-client.js';
import { buildDateClause, formatAdsRows, buildAdsMetadata } from '../utils/gaql.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} ads */
export function registerAdsPerformance(ads) {
  ads
    .command('geo')
    .description('Geographic performance breakdown')
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
          campaign_criterion.location.geo_target_constant,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.cost_micros
        FROM geographic_view
        ${where}
        ${orderBy}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No geo data', globalOpts, metadata);
    }));

  ads
    .command('devices')
    .description('Device performance breakdown')
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
          segments.device,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.conversions,
          metrics.cost_micros
        FROM campaign
        ${where}
        ${orderBy}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No device data', globalOpts, metadata);
    }));

  ads
    .command('demographics')
    .description('Demographic performance breakdown')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--type <type>', 'Demographic type: age or gender', 'age')
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

      const isGender = opts.type === 'gender';
      const resource = isGender ? 'gender_view' : 'age_range_view';
      const dimension = isGender
        ? 'ad_group_criterion.gender.type'
        : 'ad_group_criterion.age_range.type';

      const query = `
        SELECT
          ${dimension},
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.cost_micros
        FROM ${resource}
        ${where}
        ${orderBy}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No demographic data', globalOpts, metadata);
    }));

  ads
    .command('landing-pages')
    .description('Landing page performance')
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
          landing_page_view.unexpanded_final_url,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.cost_micros
        FROM landing_page_view
        ${where}
        ${orderBy}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No landing page data', globalOpts, metadata);
    }));
}
