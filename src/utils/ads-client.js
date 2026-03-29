import { GoogleAdsApi } from 'google-ads-api';
import { loadClientSecret, loadTokens, loadConfig } from '../config.js';

/**
 * Get an authenticated Google Ads customer instance
 * @param {string} [customerIdOverride] - Override the default customer ID
 * @returns {import('google-ads-api').Customer}
 */
export function getAdsCustomer(customerIdOverride) {
  const creds = loadClientSecret();
  const tokens = loadTokens();
  const config = loadConfig();

  if (!tokens?.refresh_token) {
    throw new Error('Not authenticated. Run: analytics-cli login');
  }

  if (!config.developerToken) {
    throw new Error('Google Ads developer token not configured. Run: analytics-cli ads setup');
  }

  const customerId = customerIdOverride || config.defaultCustomerId;
  if (!customerId) {
    throw new Error('No customer ID. Use --customer-id or set a default with: analytics-cli ads setup');
  }

  const client = new GoogleAdsApi({
    client_id: creds.client_id,
    client_secret: creds.client_secret,
    developer_token: config.developerToken,
  });

  return client.Customer({
    customer_id: customerId,
    login_customer_id: config.mccId || undefined,
    refresh_token: tokens.refresh_token,
  });
}
