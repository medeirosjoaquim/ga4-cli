import { getDataClient } from '../utils/client.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} program */
export function registerMetadata(program) {
  const metadata = program.command('metadata').description('View available dimensions & metrics');

  metadata
    .command('dimensions <propertyId>')
    .description('List all available dimensions')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getDataClient();
      const name = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.getMetadata({ name: `${name}/metadata` });
      const data = response.dimensions.map(d => ({
        apiName: d.apiName,
        uiName: d.uiName,
        description: d.description,
        category: d.category,
      }));
      output(data, cmd.optsWithGlobals());
    }));

  metadata
    .command('metrics <propertyId>')
    .description('List all available metrics')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getDataClient();
      const name = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.getMetadata({ name: `${name}/metadata` });
      const data = response.metrics.map(m => ({
        apiName: m.apiName,
        uiName: m.uiName,
        description: m.description,
        category: m.category,
        type: m.type,
      }));
      output(data, cmd.optsWithGlobals());
    }));

  metadata
    .command('compatibility <propertyId>')
    .description('Check which dimensions and metrics are compatible together')
    .option('--dimensions <dims>', 'Comma-separated dimensions to check')
    .option('--metrics <metrics>', 'Comma-separated metrics to check')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getDataClient();
      const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;

      const request = { property };
      if (opts.dimensions) {
        request.dimensions = opts.dimensions.split(',').map(name => ({ name: name.trim() }));
      }
      if (opts.metrics) {
        request.metrics = opts.metrics.split(',').map(name => ({ name: name.trim() }));
      }

      const [response] = await client.checkCompatibility(request);
      const data = {
        compatibleDimensions: (response.dimensionCompatibilities || []).map(d => ({
          dimension: d.dimensionMetadata?.apiName,
          compatible: d.compatibility,
        })),
        compatibleMetrics: (response.metricCompatibilities || []).map(m => ({
          metric: m.metricMetadata?.apiName,
          compatible: m.compatibility,
        })),
      };
      output(data, cmd.optsWithGlobals());
    }));
}
