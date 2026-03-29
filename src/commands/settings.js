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

  dataRetention
    .command('update <propertyId>')
    .description('Update data retention settings')
    .option('--event-data-retention <period>', 'TWO_MONTHS, FOURTEEN_MONTHS, TWENTY_SIX_MONTHS, THIRTY_EIGHT_MONTHS, FIFTY_MONTHS')
    .option('--reset-on-new-activity', 'Reset user data on new activity')
    .option('--no-reset-on-new-activity', 'Do not reset user data on new activity')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const name = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const resourceName = `${name}/dataRetentionSettings`;
      const updateMask = [];
      const dataRetentionSettings = { name: resourceName };
      if (opts.eventDataRetention) { dataRetentionSettings.eventDataRetention = opts.eventDataRetention.toUpperCase(); updateMask.push('eventDataRetention'); }
      if (opts.resetOnNewActivity !== undefined) { dataRetentionSettings.resetUserDataOnNewActivity = opts.resetOnNewActivity; updateMask.push('resetUserDataOnNewActivity'); }
      if (!updateMask.length) throw new Error('Provide at least one setting to update');
      const [response] = await client.updateDataRetentionSettings({
        dataRetentionSettings,
        updateMask: { paths: updateMask },
      });
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

  attribution
    .command('update <propertyId>')
    .description('Update attribution settings')
    .option('--model <model>', 'Reporting attribution model')
    .option('--acquisition-lookback <window>', 'Acquisition conversion event lookback window')
    .option('--other-lookback <window>', 'Other conversion event lookback window')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const name = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const resourceName = `${name}/attributionSettings`;
      const updateMask = [];
      const attributionSettings = { name: resourceName };
      if (opts.model) { attributionSettings.reportingAttributionModel = opts.model; updateMask.push('reportingAttributionModel'); }
      if (opts.acquisitionLookback) { attributionSettings.acquisitionConversionEventLookbackWindow = opts.acquisitionLookback; updateMask.push('acquisitionConversionEventLookbackWindow'); }
      if (opts.otherLookback) { attributionSettings.otherConversionEventLookbackWindow = opts.otherLookback; updateMask.push('otherConversionEventLookbackWindow'); }
      if (!updateMask.length) throw new Error('Provide at least one setting to update');
      const [response] = await client.updateAttributionSettings({
        attributionSettings,
        updateMask: { paths: updateMask },
      });
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

  googleSignals
    .command('update <propertyId>')
    .description('Update Google Signals settings')
    .requiredOption('--state <state>', 'GOOGLE_SIGNALS_ENABLED or GOOGLE_SIGNALS_DISABLED')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const name = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const resourceName = `${name}/googleSignalsSettings`;
      const [response] = await client.updateGoogleSignalsSettings({
        googleSignalsSettings: { name: resourceName, state: opts.state },
        updateMask: { paths: ['state'] },
      });
      output({
        name: response.name,
        state: response.state,
        consent: response.consent,
      }, cmd.optsWithGlobals());
    }));
}
