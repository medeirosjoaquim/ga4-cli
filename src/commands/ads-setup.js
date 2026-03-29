import { createInterface } from 'node:readline';
import { loadConfig, saveConfig } from '../config.js';
import { getAdsCustomer } from '../utils/ads-client.js';
import { formatAdsRows } from '../utils/gaql.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/**
 * Prompt the user for input
 * @param {string} question
 * @param {string} [defaultVal]
 * @returns {Promise<string>}
 */
function prompt(question, defaultVal) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const suffix = defaultVal ? ` [${defaultVal}]` : '';
  return new Promise(resolve => {
    rl.question(`${question}${suffix}: `, answer => {
      rl.close();
      resolve(answer.trim() || defaultVal || '');
    });
  });
}

/** @param {import('commander').Command} program */
export function registerAdsSetup(program) {
  const ads = program.command('ads').description('Google Ads commands');

  ads
    .command('setup')
    .description('Configure Google Ads API credentials')
    .action(withErrorHandler(async () => {
      const config = loadConfig();

      const developerToken = await prompt('Developer token', config.developerToken);
      const mccId = await prompt('MCC (manager) account ID (optional)', config.mccId);
      const defaultCustomerId = await prompt('Default customer ID', config.defaultCustomerId);

      saveConfig({
        developerToken,
        mccId: mccId.replace(/-/g, ''),
        defaultCustomerId: defaultCustomerId.replace(/-/g, ''),
      });

      console.log('Google Ads configuration saved.');
    }));

  ads
    .command('accounts')
    .description('List accessible customer accounts')
    .option('--customer-id <id>', 'Customer ID (MCC account)')
    .action(withErrorHandler(async (opts, cmd) => {
      const customer = getAdsCustomer(opts.customerId);
      const rows = await customer.query(`
        SELECT
          customer_client.id,
          customer_client.descriptive_name,
          customer_client.status,
          customer_client.manager
        FROM customer_client
      `);
      const data = formatAdsRows(rows);
      output(data, cmd.optsWithGlobals());
    }));

  return ads;
}
