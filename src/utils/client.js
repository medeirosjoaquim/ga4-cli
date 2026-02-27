import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import { getAccessToken } from '../auth.js';

function makeAuthClient(token) {
  const headers = { Authorization: `Bearer ${token}` };
  return {
    getAccessToken: async () => ({ token }),
    getRequestMetadata: async () => headers,
    getRequestHeaders: async () => headers,
  };
}

/**
 * Create an authenticated Analytics Data API client
 * @returns {Promise<InstanceType<typeof BetaAnalyticsDataClient>>}
 */
export async function getDataClient() {
  const token = await getAccessToken();
  return new BetaAnalyticsDataClient({ authClient: makeAuthClient(token) });
}

/**
 * Create an authenticated Analytics Admin API client
 * @returns {Promise<InstanceType<typeof AnalyticsAdminServiceClient>>}
 */
export async function getAdminClient() {
  const token = await getAccessToken();
  return new AnalyticsAdminServiceClient({ authClient: makeAuthClient(token) });
}
