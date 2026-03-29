import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import { getAccessToken } from '../auth.js';

function makeAuthClient() {
  return {
    getAccessToken: async () => ({ token: await getAccessToken() }),
    getRequestMetadata: async () => ({ Authorization: `Bearer ${await getAccessToken()}` }),
    getRequestHeaders: async () => new Map([['Authorization', `Bearer ${await getAccessToken()}`]]),
  };
}

/**
 * Create an authenticated Analytics Data API client
 * @returns {Promise<InstanceType<typeof BetaAnalyticsDataClient>>}
 */
export async function getDataClient() {
  return new BetaAnalyticsDataClient({ authClient: makeAuthClient() });
}

/**
 * Create an authenticated Analytics Admin API client
 * @returns {Promise<InstanceType<typeof AnalyticsAdminServiceClient>>}
 */
export async function getAdminClient() {
  return new AnalyticsAdminServiceClient({ authClient: makeAuthClient() });
}
