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
}
