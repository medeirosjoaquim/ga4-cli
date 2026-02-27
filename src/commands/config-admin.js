import { getAdminClient } from '../utils/client.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} program */
export function registerConfigAdmin(program) {
  const config = program.command('config').description('View property configuration');

  // Conversion events
  const conversions = config.command('conversions').description('Conversion events');
  conversions
    .command('list <propertyId>')
    .description('List conversion events')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listConversionEvents({ parent });
      const data = response.map(e => ({
        name: e.name,
        eventName: e.eventName,
        deletable: e.deletable,
        custom: e.custom,
        createTime: e.createTime?.seconds ? new Date(Number(e.createTime.seconds) * 1000).toISOString() : '',
      }));
      output(data, cmd.optsWithGlobals());
    }));

  // Custom dimensions
  const customDims = config.command('custom-dimensions').description('Custom dimensions');
  customDims
    .command('list <propertyId>')
    .description('List custom dimensions')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listCustomDimensions({ parent });
      const data = response.map(d => ({
        name: d.name,
        parameterName: d.parameterName,
        displayName: d.displayName,
        description: d.description,
        scope: d.scope,
      }));
      output(data, cmd.optsWithGlobals());
    }));

  // Custom metrics
  const customMetrics = config.command('custom-metrics').description('Custom metrics');
  customMetrics
    .command('list <propertyId>')
    .description('List custom metrics')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listCustomMetrics({ parent });
      const data = response.map(m => ({
        name: m.name,
        parameterName: m.parameterName,
        displayName: m.displayName,
        description: m.description,
        scope: m.scope,
        measurementUnit: m.measurementUnit,
      }));
      output(data, cmd.optsWithGlobals());
    }));

  // Audiences
  const audiences = config.command('audiences').description('Audiences');
  audiences
    .command('list <propertyId>')
    .description('List audiences')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listAudiences({ parent });
      const data = response.map(a => ({
        name: a.name,
        displayName: a.displayName,
        description: a.description,
        membershipDurationDays: a.membershipDurationDays,
      }));
      output(data, cmd.optsWithGlobals());
    }));

  audiences
    .command('get <propertyId> <audienceId>')
    .description('Get audience details')
    .action(withErrorHandler(async (propertyId, audienceId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/audiences/${audienceId}`;
      const [audience] = await client.getAudience({ name });
      output({
        name: audience.name,
        displayName: audience.displayName,
        description: audience.description,
        membershipDurationDays: audience.membershipDurationDays,
        filterClauses: JSON.stringify(audience.filterClauses),
      }, cmd.optsWithGlobals());
    }));

  // Key events (replaces deprecated conversion events)
  const keyEvents = config.command('key-events').description('Key events');
  keyEvents
    .command('list <propertyId>')
    .description('List key events')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listKeyEvents({ parent });
      const data = response.map(e => ({
        name: e.name,
        eventName: e.eventName,
        countingMethod: e.countingMethod,
        custom: e.custom,
        createTime: e.createTime?.seconds ? new Date(Number(e.createTime.seconds) * 1000).toISOString() : '',
      }));
      output(data, cmd.optsWithGlobals());
    }));

  keyEvents
    .command('get <keyEventName>')
    .description('Get key event details (full resource name: properties/X/keyEvents/Y)')
    .action(withErrorHandler(async (keyEventName, opts, cmd) => {
      const client = await getAdminClient();
      const [keyEvent] = await client.getKeyEvent({ name: keyEventName });
      output({
        name: keyEvent.name,
        eventName: keyEvent.eventName,
        countingMethod: keyEvent.countingMethod,
        custom: keyEvent.custom,
        deletable: keyEvent.deletable,
        createTime: keyEvent.createTime?.seconds ? new Date(Number(keyEvent.createTime.seconds) * 1000).toISOString() : '',
      }, cmd.optsWithGlobals());
    }));

  // Channel groups
  const channelGroups = config.command('channel-groups').description('Channel groups');
  channelGroups
    .command('list <propertyId>')
    .description('List channel groups')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listChannelGroups({ parent });
      const data = response.map(g => ({
        name: g.name,
        displayName: g.displayName,
        description: g.description,
        systemDefined: g.systemDefined,
      }));
      output(data, cmd.optsWithGlobals());
    }));

  channelGroups
    .command('get <channelGroupName>')
    .description('Get channel group details (full resource name: properties/X/channelGroups/Y)')
    .action(withErrorHandler(async (channelGroupName, opts, cmd) => {
      const client = await getAdminClient();
      const [group] = await client.getChannelGroup({ name: channelGroupName });
      output({
        name: group.name,
        displayName: group.displayName,
        description: group.description,
        systemDefined: group.systemDefined,
        groupingRule: group.groupingRule ? JSON.stringify(group.groupingRule) : '',
      }, cmd.optsWithGlobals());
    }));

  // Calculated metrics
  const calculatedMetrics = config.command('calculated-metrics').description('Calculated metrics');
  calculatedMetrics
    .command('list <propertyId>')
    .description('List calculated metrics')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listCalculatedMetrics({ parent });
      const data = response.map(m => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        calculatedMetricId: m.calculatedMetricId,
        metricUnit: m.metricUnit,
        formula: m.formula,
      }));
      output(data, cmd.optsWithGlobals());
    }));

  calculatedMetrics
    .command('get <calculatedMetricName>')
    .description('Get calculated metric details (full resource name: properties/X/calculatedMetrics/Y)')
    .action(withErrorHandler(async (calculatedMetricName, opts, cmd) => {
      const client = await getAdminClient();
      const [metric] = await client.getCalculatedMetric({ name: calculatedMetricName });
      output({
        name: metric.name,
        displayName: metric.displayName,
        description: metric.description,
        calculatedMetricId: metric.calculatedMetricId,
        metricUnit: metric.metricUnit,
        formula: metric.formula,
        restrictedMetricType: metric.restrictedMetricType,
        invalidMetricReference: metric.invalidMetricReference,
      }, cmd.optsWithGlobals());
    }));
}
