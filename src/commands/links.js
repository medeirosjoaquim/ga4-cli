import { getAdminClient } from '../utils/client.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} program */
export function registerLinks(program) {
  const links = program.command('links').description('View linked services');

  // Google Ads links
  const googleAds = links.command('google-ads').description('Google Ads links');
  googleAds
    .command('list <propertyId>')
    .description('List Google Ads links')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listGoogleAdsLinks({ parent });
      const data = response.map(l => ({
        name: l.name,
        customerId: l.customerId,
        canManageClients: l.canManageClients,
        adsPersonalizationEnabled: l.adsPersonalizationEnabled,
        createTime: l.createTime?.seconds ? new Date(Number(l.createTime.seconds) * 1000).toISOString() : '',
      }));
      output(data, cmd.optsWithGlobals());
    }));

  // Firebase links
  const firebase = links.command('firebase').description('Firebase links');
  firebase
    .command('list <propertyId>')
    .description('List Firebase links')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listFirebaseLinks({ parent });
      const data = response.map(l => ({
        name: l.name,
        project: l.project,
        createTime: l.createTime?.seconds ? new Date(Number(l.createTime.seconds) * 1000).toISOString() : '',
      }));
      output(data, cmd.optsWithGlobals());
    }));

  // BigQuery links
  const bigquery = links.command('bigquery').description('BigQuery links');
  bigquery
    .command('list <propertyId>')
    .description('List BigQuery links')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listBigQueryLinks({ parent });
      const data = response.map(l => ({
        name: l.name,
        project: l.project,
        dailyExportEnabled: l.dailyExportEnabled,
        streamingExportEnabled: l.streamingExportEnabled,
        freshDailyExportEnabled: l.freshDailyExportEnabled,
      }));
      output(data, cmd.optsWithGlobals());
    }));

  // DV360 links
  const dv360 = links.command('dv360').description('Display & Video 360 links');
  dv360
    .command('list <propertyId>')
    .description('List Display & Video 360 advertiser links')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listDisplayVideo360AdvertiserLinks({ parent });
      const data = response.map(l => ({
        name: l.name,
        advertiserId: l.advertiserId,
        advertiserDisplayName: l.advertiserDisplayName,
        adsPersonalizationEnabled: l.adsPersonalizationEnabled,
        campaignDataSharingEnabled: l.campaignDataSharingEnabled,
        costDataSharingEnabled: l.costDataSharingEnabled,
      }));
      output(data, cmd.optsWithGlobals());
    }));

  // Search Ads 360 links
  const searchAds = links.command('search-ads').description('Search Ads 360 links');
  searchAds
    .command('list <propertyId>')
    .description('List Search Ads 360 links')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listSearchAds360Links({ parent });
      const data = response.map(l => ({
        name: l.name,
        advertiserId: l.advertiserId,
        advertiserDisplayName: l.advertiserDisplayName,
        adsPersonalizationEnabled: l.adsPersonalizationEnabled,
        campaignDataSharingEnabled: l.campaignDataSharingEnabled,
        costDataSharingEnabled: l.costDataSharingEnabled,
        siteStatsSharingEnabled: l.siteStatsSharingEnabled,
      }));
      output(data, cmd.optsWithGlobals());
    }));

  // AdSense links
  const adsense = links.command('adsense').description('AdSense links');
  adsense
    .command('list <propertyId>')
    .description('List AdSense links')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listAdSenseLinks({ parent });
      const data = response.map(l => ({
        name: l.name,
        adClientCode: l.adClientCode,
      }));
      output(data, cmd.optsWithGlobals());
    }));
}
