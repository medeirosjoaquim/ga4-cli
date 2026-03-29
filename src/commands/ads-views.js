import { getAdsCustomer } from '../utils/ads-client.js';
import { buildDateClause, formatAdsRows, buildAdsMetadata } from '../utils/gaql.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} ads */
export function registerAdsViews(ads) {
  ads
    .command('audiences')
    .description('Audience performance by campaign or ad group')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--level <level>', 'Level: campaign or adgroup', 'campaign')
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

      let query;
      if (opts.level === 'adgroup') {
        query = `
          SELECT
            ad_group_criterion.criterion_id,
            ad_group.name,
            campaign.name,
            ad_group_criterion.display_name,
            metrics.impressions,
            metrics.clicks,
            metrics.conversions,
            metrics.cost_micros
          FROM ad_group_audience_view
          ${where}
          ${orderBy}
          LIMIT ${opts.limit}
        `;
      } else {
        query = `
          SELECT
            campaign_criterion.criterion_id,
            campaign.name,
            campaign_criterion.display_name,
            metrics.impressions,
            metrics.clicks,
            metrics.conversions,
            metrics.cost_micros
          FROM campaign_audience_view
          ${where}
          ${orderBy}
          LIMIT ${opts.limit}
        `;
      }

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No audience data', globalOpts, metadata);
    }));

  ads
    .command('conversions')
    .description('List conversion actions')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--status <status>', 'Filter by status')
    .option('--limit <n>', 'Row limit', '50')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);

      let where = `WHERE conversion_action.status != 'REMOVED'`;
      if (opts.status) {
        where = `WHERE conversion_action.status = '${opts.status.toUpperCase()}'`;
      }

      const query = `
        SELECT
          conversion_action.id,
          conversion_action.name,
          conversion_action.status,
          conversion_action.type,
          conversion_action.category
        FROM conversion_action
        ${where}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default');
      output(data.length ? data : 'No conversion data', globalOpts, metadata);
    }));

  ads
    .command('change-history')
    .description('View account change history')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--resource-type <type>', 'Filter by resource type (CAMPAIGN, AD_GROUP, AD, etc.)')
    .option('--start <date>', 'Start date YYYY-MM-DD')
    .option('--end <date>', 'End date YYYY-MM-DD')
    .option('--during <period>', 'Predefined period')
    .option('--limit <n>', 'Row limit', '50')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);
      const dateClause = buildDateClause(opts);

      let where = `WHERE ${dateClause}`;
      if (opts.resourceType) {
        where += ` AND change_event.change_resource_type = '${opts.resourceType.toUpperCase()}'`;
      }

      const query = `
        SELECT
          change_event.change_date_time,
          change_event.change_resource_type,
          change_event.user_email,
          change_event.client_type,
          change_event.resource_name
        FROM change_event
        ${where}
        ORDER BY change_event.change_date_time DESC
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No change history data', globalOpts, metadata);
    }));

  ads
    .command('recommendations')
    .description('View account recommendations')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--type <type>', 'Filter by recommendation type')
    .option('--limit <n>', 'Row limit', '50')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);

      let where = '';
      if (opts.type) {
        where = `WHERE recommendation.type = '${opts.type.toUpperCase()}'`;
      }

      const query = `
        SELECT
          recommendation.type,
          recommendation.impact,
          recommendation.campaign,
          recommendation.ad_group
        FROM recommendation
        ${where}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default');
      output(data.length ? data : 'No recommendation data', globalOpts, metadata);
    }));

  ads
    .command('assets')
    .description('List account assets')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--type <type>', 'Filter by asset type (TEXT, IMAGE, etc.)')
    .option('--limit <n>', 'Row limit', '50')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);

      let where = '';
      if (opts.type) {
        where = `WHERE asset.type = '${opts.type.toUpperCase()}'`;
      }

      const query = `
        SELECT
          asset.id,
          asset.name,
          asset.type,
          asset.text_asset.text,
          asset.image_asset.full_size.url
        FROM asset
        ${where}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default');
      output(data.length ? data : 'No asset data', globalOpts, metadata);
    }));

  ads
    .command('shopping')
    .description('Shopping performance report')
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
          segments.product_title,
          segments.product_type_l1,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM shopping_performance_view
        ${where}
        ${orderBy}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default', dateClause);
      output(data.length ? data : 'No shopping data', globalOpts, metadata);
    }));

  ads
    .command('extensions')
    .description('List asset group assets (extensions)')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--campaign <id>', 'Filter by campaign ID')
    .option('--limit <n>', 'Row limit', '50')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);

      let where = '';
      if (opts.campaign) {
        where = `WHERE campaign.id = ${opts.campaign}`;
      }

      const query = `
        SELECT
          asset_group_asset.asset,
          asset_group_asset.field_type,
          asset_group_asset.status,
          asset_group.name,
          campaign.name
        FROM asset_group_asset
        ${where}
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default');
      output(data.length ? data : 'No extension data', globalOpts, metadata);
    }));

  ads
    .command('labels')
    .description('List account labels')
    .option('--customer-id <id>', 'Customer ID override')
    .option('--limit <n>', 'Row limit', '50')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);

      const query = `
        SELECT
          label.id,
          label.name,
          label.status,
          label.text_label.background_color,
          label.text_label.description
        FROM label
        LIMIT ${opts.limit}
      `;

      const rows = await customer.query(query);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(query, opts.customerId || 'default');
      output(data.length ? data : 'No label data', globalOpts, metadata);
    }));
}
