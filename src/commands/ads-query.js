import { getAdsCustomer } from '../utils/ads-client.js';
import { formatAdsRows, buildAdsMetadata } from '../utils/gaql.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} ads */
export function registerAdsQuery(ads) {
  ads
    .command('query <gaql>')
    .description('Run a raw GAQL query')
    .option('--customer-id <id>', 'Customer ID override')
    .action(withErrorHandler(async (gaql, opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);
      const rows = await customer.query(gaql);
      const data = formatAdsRows(rows);

      const globalOpts = cmd.optsWithGlobals();
      const metadata = buildAdsMetadata(gaql, opts.customerId || 'default', 'from query');
      output(data.length ? data : 'No results', globalOpts, metadata);
    }));
}
