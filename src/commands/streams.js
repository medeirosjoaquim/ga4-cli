import { getAdminClient } from '../utils/client.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} program */
export function registerStreams(program) {
  const streams = program.command('streams').description('Manage data streams');

  streams
    .command('list <propertyId>')
    .description('List data streams')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listDataStreams({ parent });
      const data = response.map(s => ({
        name: s.name,
        displayName: s.displayName,
        type: s.type,
        webStreamData: s.webStreamData?.defaultUri || '',
      }));
      output(data, cmd.optsWithGlobals());
    }));

  streams
    .command('get <propertyId> <streamId>')
    .description('Get stream details')
    .action(withErrorHandler(async (propertyId, streamId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/dataStreams/${streamId}`;
      const [stream] = await client.getDataStream({ name });
      output({
        name: stream.name,
        displayName: stream.displayName,
        type: stream.type,
        webStreamData: stream.webStreamData ? {
          measurementId: stream.webStreamData.measurementId,
          defaultUri: stream.webStreamData.defaultUri,
        } : null,
        createTime: stream.createTime?.seconds ? new Date(Number(stream.createTime.seconds) * 1000).toISOString() : '',
        updateTime: stream.updateTime?.seconds ? new Date(Number(stream.updateTime.seconds) * 1000).toISOString() : '',
      }, cmd.optsWithGlobals());
    }));

  streams
    .command('enhanced-measurement <propertyId> <streamId>')
    .description('Get enhanced measurement settings for a web stream')
    .action(withErrorHandler(async (propertyId, streamId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/dataStreams/${streamId}/enhancedMeasurementSettings`;
      const [response] = await client.getEnhancedMeasurementSettings({ name });
      output({
        name: response.name,
        streamEnabled: response.streamEnabled,
        scrollsEnabled: response.scrollsEnabled,
        outboundClicksEnabled: response.outboundClicksEnabled,
        siteSearchEnabled: response.siteSearchEnabled,
        videoEngagementEnabled: response.videoEngagementEnabled,
        fileDownloadsEnabled: response.fileDownloadsEnabled,
        pageChangesEnabled: response.pageChangesEnabled,
        formInteractionsEnabled: response.formInteractionsEnabled,
        searchQueryParameter: response.searchQueryParameter,
        uriQueryParameter: response.uriQueryParameter,
      }, cmd.optsWithGlobals());
    }));

  streams
    .command('create <propertyId>')
    .description('Create a data stream')
    .requiredOption('--type <type>', 'Stream type: WEB_DATA_STREAM, ANDROID_APP_DATA_STREAM, or IOS_APP_DATA_STREAM')
    .requiredOption('--display-name <name>', 'Display name')
    .option('--url <url>', 'Default URI (for web streams)')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const dataStream = {
        displayName: opts.displayName,
        type: opts.type.toUpperCase(),
      };
      if (opts.url) dataStream.webStreamData = { defaultUri: opts.url };
      const [stream] = await client.createDataStream({ parent, dataStream });
      output({
        name: stream.name,
        displayName: stream.displayName,
        type: stream.type,
      }, cmd.optsWithGlobals());
    }));

  streams
    .command('update <propertyId> <streamId>')
    .description('Update a data stream')
    .option('--display-name <name>', 'New display name')
    .action(withErrorHandler(async (propertyId, streamId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/dataStreams/${streamId}`;
      if (!opts.displayName) throw new Error('Provide --display-name');
      const [stream] = await client.updateDataStream({
        dataStream: { name, displayName: opts.displayName },
        updateMask: { paths: ['displayName'] },
      });
      output({
        name: stream.name,
        displayName: stream.displayName,
        type: stream.type,
      }, cmd.optsWithGlobals());
    }));

  streams
    .command('delete <propertyId> <streamId>')
    .description('Delete a data stream')
    .action(withErrorHandler(async (propertyId, streamId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/dataStreams/${streamId}`;
      await client.deleteDataStream({ name });
      output({ deleted: name }, cmd.optsWithGlobals());
    }));

  const secrets = streams.command('measurement-secrets').description('Measurement protocol secrets');

  secrets
    .command('list <propertyId> <streamId>')
    .description('List measurement protocol secrets')
    .action(withErrorHandler(async (propertyId, streamId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const parentName = `${parent}/dataStreams/${streamId}`;
      const [response] = await client.listMeasurementProtocolSecrets({ parent: parentName });
      const data = response.map(s => ({
        name: s.name,
        displayName: s.displayName,
        secretValue: s.secretValue,
      }));
      output(data, cmd.optsWithGlobals());
    }));

  secrets
    .command('create <propertyId> <streamId>')
    .description('Create a measurement protocol secret')
    .requiredOption('--display-name <name>', 'Display name')
    .action(withErrorHandler(async (propertyId, streamId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const parentName = `${parent}/dataStreams/${streamId}`;
      const [secret] = await client.createMeasurementProtocolSecret({
        parent: parentName,
        measurementProtocolSecret: { displayName: opts.displayName },
      });
      output({
        name: secret.name,
        displayName: secret.displayName,
        secretValue: secret.secretValue,
      }, cmd.optsWithGlobals());
    }));

  secrets
    .command('delete <propertyId> <streamId> <secretId>')
    .description('Delete a measurement protocol secret')
    .action(withErrorHandler(async (propertyId, streamId, secretId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/dataStreams/${streamId}/measurementProtocolSecrets/${secretId}`;
      await client.deleteMeasurementProtocolSecret({ name });
      output({ deleted: name }, cmd.optsWithGlobals());
    }));
}
