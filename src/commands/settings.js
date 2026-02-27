import { getAdminClient } from '../utils/client.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} program */
export function registerSettings(program) {
  const settings = program.command('settings').description('View property settings');

  // Data retention
  const dataRetention = settings.command('data-retention').description('Data retention settings');
  dataRetention
    .command('get <propertyId>')
    .description('Get data retention settings')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const name = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.getDataRetentionSettings({ name: `${name}/dataRetentionSettings` });
      output({
        name: response.name,
        eventDataRetention: response.eventDataRetention,
        resetUserDataOnNewActivity: response.resetUserDataOnNewActivity,
      }, cmd.optsWithGlobals());
    }));

  // Attribution settings
  const attribution = settings.command('attribution').description('Attribution settings');
  attribution
    .command('get <propertyId>')
    .description('Get attribution settings')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const name = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.getAttributionSettings({ name: `${name}/attributionSettings` });
      output({
        name: response.name,
        acquisitionConversionEventLookbackWindow: response.acquisitionConversionEventLookbackWindow,
        otherConversionEventLookbackWindow: response.otherConversionEventLookbackWindow,
        reportingAttributionModel: response.reportingAttributionModel,
      }, cmd.optsWithGlobals());
    }));

  // Google Signals
  const googleSignals = settings.command('google-signals').description('Google Signals settings');
  googleSignals
    .command('get <propertyId>')
    .description('Get Google Signals settings')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const name = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.getGoogleSignalsSettings({ name: `${name}/googleSignalsSettings` });
      output({
        name: response.name,
        state: response.state,
        consent: response.consent,
      }, cmd.optsWithGlobals());
    }));
}
