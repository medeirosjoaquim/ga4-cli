import { readFileSync } from 'node:fs';
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

  customDims
    .command('get <propertyId> <customDimensionId>')
    .description('Get custom dimension details')
    .action(withErrorHandler(async (propertyId, customDimensionId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/customDimensions/${customDimensionId}`;
      const [dim] = await client.getCustomDimension({ name });
      output({
        name: dim.name,
        parameterName: dim.parameterName,
        displayName: dim.displayName,
        description: dim.description,
        scope: dim.scope,
      }, cmd.optsWithGlobals());
    }));

  customDims
    .command('create <propertyId>')
    .description('Create a custom dimension')
    .requiredOption('--parameter-name <name>', 'Event parameter name')
    .requiredOption('--display-name <name>', 'Display name')
    .option('--description <desc>', 'Description')
    .requiredOption('--scope <scope>', 'Scope: EVENT, USER, or ITEM')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [dim] = await client.createCustomDimension({
        parent,
        customDimension: {
          parameterName: opts.parameterName,
          displayName: opts.displayName,
          description: opts.description || '',
          scope: opts.scope.toUpperCase(),
        },
      });
      output({
        name: dim.name,
        parameterName: dim.parameterName,
        displayName: dim.displayName,
        scope: dim.scope,
      }, cmd.optsWithGlobals());
    }));

  customDims
    .command('update <propertyId> <customDimensionId>')
    .description('Update a custom dimension')
    .option('--display-name <name>', 'New display name')
    .option('--description <desc>', 'New description')
    .action(withErrorHandler(async (propertyId, customDimensionId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/customDimensions/${customDimensionId}`;
      const updateMask = [];
      const customDimension = { name };
      if (opts.displayName) { customDimension.displayName = opts.displayName; updateMask.push('displayName'); }
      if (opts.description !== undefined) { customDimension.description = opts.description; updateMask.push('description'); }
      if (!updateMask.length) throw new Error('Provide at least --display-name or --description');
      const [dim] = await client.updateCustomDimension({
        customDimension,
        updateMask: { paths: updateMask },
      });
      output({
        name: dim.name,
        parameterName: dim.parameterName,
        displayName: dim.displayName,
        description: dim.description,
        scope: dim.scope,
      }, cmd.optsWithGlobals());
    }));

  customDims
    .command('archive <propertyId> <customDimensionId>')
    .description('Archive a custom dimension')
    .action(withErrorHandler(async (propertyId, customDimensionId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/customDimensions/${customDimensionId}`;
      await client.archiveCustomDimension({ name });
      output({ archived: name }, cmd.optsWithGlobals());
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

  customMetrics
    .command('get <propertyId> <customMetricId>')
    .description('Get custom metric details')
    .action(withErrorHandler(async (propertyId, customMetricId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/customMetrics/${customMetricId}`;
      const [metric] = await client.getCustomMetric({ name });
      output({
        name: metric.name,
        parameterName: metric.parameterName,
        displayName: metric.displayName,
        description: metric.description,
        scope: metric.scope,
        measurementUnit: metric.measurementUnit,
      }, cmd.optsWithGlobals());
    }));

  customMetrics
    .command('create <propertyId>')
    .description('Create a custom metric')
    .requiredOption('--parameter-name <name>', 'Event parameter name')
    .requiredOption('--display-name <name>', 'Display name')
    .option('--description <desc>', 'Description')
    .requiredOption('--scope <scope>', 'Scope: EVENT')
    .requiredOption('--measurement-unit <unit>', 'Unit: STANDARD, CURRENCY, FEET, METERS, KILOMETERS, MILES, MILLISECONDS, SECONDS, MINUTES, HOURS')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [metric] = await client.createCustomMetric({
        parent,
        customMetric: {
          parameterName: opts.parameterName,
          displayName: opts.displayName,
          description: opts.description || '',
          scope: opts.scope.toUpperCase(),
          measurementUnit: opts.measurementUnit.toUpperCase(),
        },
      });
      output({
        name: metric.name,
        parameterName: metric.parameterName,
        displayName: metric.displayName,
        scope: metric.scope,
        measurementUnit: metric.measurementUnit,
      }, cmd.optsWithGlobals());
    }));

  customMetrics
    .command('update <propertyId> <customMetricId>')
    .description('Update a custom metric')
    .option('--display-name <name>', 'New display name')
    .option('--description <desc>', 'New description')
    .option('--measurement-unit <unit>', 'New measurement unit')
    .action(withErrorHandler(async (propertyId, customMetricId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/customMetrics/${customMetricId}`;
      const updateMask = [];
      const customMetric = { name };
      if (opts.displayName) { customMetric.displayName = opts.displayName; updateMask.push('displayName'); }
      if (opts.description !== undefined) { customMetric.description = opts.description; updateMask.push('description'); }
      if (opts.measurementUnit) { customMetric.measurementUnit = opts.measurementUnit.toUpperCase(); updateMask.push('measurementUnit'); }
      if (!updateMask.length) throw new Error('Provide at least one field to update');
      const [metric] = await client.updateCustomMetric({
        customMetric,
        updateMask: { paths: updateMask },
      });
      output({
        name: metric.name,
        parameterName: metric.parameterName,
        displayName: metric.displayName,
        description: metric.description,
        scope: metric.scope,
        measurementUnit: metric.measurementUnit,
      }, cmd.optsWithGlobals());
    }));

  customMetrics
    .command('archive <propertyId> <customMetricId>')
    .description('Archive a custom metric')
    .action(withErrorHandler(async (propertyId, customMetricId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/customMetrics/${customMetricId}`;
      await client.archiveCustomMetric({ name });
      output({ archived: name }, cmd.optsWithGlobals());
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

  audiences
    .command('create <propertyId>')
    .description('Create an audience')
    .requiredOption('--display-name <name>', 'Display name')
    .option('--description <desc>', 'Description')
    .option('--membership-duration-days <n>', 'Membership duration in days', '30')
    .option('--filter-json <path>', 'Path to JSON file with filterClauses array')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const audience = {
        displayName: opts.displayName,
        description: opts.description || '',
        membershipDurationDays: parseInt(opts.membershipDurationDays, 10),
      };
      if (opts.filterJson) {
        audience.filterClauses = JSON.parse(readFileSync(opts.filterJson, 'utf8'));
      }
      const [result] = await client.createAudience({ parent, audience });
      output({
        name: result.name,
        displayName: result.displayName,
        description: result.description,
        membershipDurationDays: result.membershipDurationDays,
      }, cmd.optsWithGlobals());
    }));

  audiences
    .command('update <propertyId> <audienceId>')
    .description('Update an audience')
    .option('--display-name <name>', 'New display name')
    .option('--description <desc>', 'New description')
    .action(withErrorHandler(async (propertyId, audienceId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/audiences/${audienceId}`;
      const updateMask = [];
      const audience = { name };
      if (opts.displayName) { audience.displayName = opts.displayName; updateMask.push('displayName'); }
      if (opts.description !== undefined) { audience.description = opts.description; updateMask.push('description'); }
      if (!updateMask.length) throw new Error('Provide at least --display-name or --description');
      const [result] = await client.updateAudience({
        audience,
        updateMask: { paths: updateMask },
      });
      output({
        name: result.name,
        displayName: result.displayName,
        description: result.description,
        membershipDurationDays: result.membershipDurationDays,
      }, cmd.optsWithGlobals());
    }));

  audiences
    .command('archive <propertyId> <audienceId>')
    .description('Archive an audience')
    .action(withErrorHandler(async (propertyId, audienceId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/audiences/${audienceId}`;
      await client.archiveAudience({ name });
      output({ archived: name }, cmd.optsWithGlobals());
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

  keyEvents
    .command('create <propertyId>')
    .description('Create a key event')
    .requiredOption('--event-name <name>', 'Event name')
    .option('--counting-method <method>', 'ONCE_PER_EVENT (default) or ONCE_PER_SESSION', 'ONCE_PER_EVENT')
    .option('--default-value <amount:currency>', 'Default value as amount:currencyCode (e.g. 10.5:USD)')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const keyEvent = {
        eventName: opts.eventName,
        countingMethod: opts.countingMethod.toUpperCase(),
      };
      if (opts.defaultValue) {
        const [amount, currency] = opts.defaultValue.split(':');
        keyEvent.defaultValue = { numericValue: parseFloat(amount), currencyCode: currency };
      }
      const [result] = await client.createKeyEvent({ parent, keyEvent });
      output({
        name: result.name,
        eventName: result.eventName,
        countingMethod: result.countingMethod,
      }, cmd.optsWithGlobals());
    }));

  keyEvents
    .command('update <keyEventName>')
    .description('Update a key event (full resource name: properties/X/keyEvents/Y)')
    .option('--counting-method <method>', 'ONCE_PER_EVENT or ONCE_PER_SESSION')
    .option('--default-value <amount:currency>', 'Default value as amount:currencyCode')
    .action(withErrorHandler(async (keyEventName, opts, cmd) => {
      const client = await getAdminClient();
      const updateMask = [];
      const keyEvent = { name: keyEventName };
      if (opts.countingMethod) { keyEvent.countingMethod = opts.countingMethod.toUpperCase(); updateMask.push('countingMethod'); }
      if (opts.defaultValue) {
        const [amount, currency] = opts.defaultValue.split(':');
        keyEvent.defaultValue = { numericValue: parseFloat(amount), currencyCode: currency };
        updateMask.push('defaultValue');
      }
      if (!updateMask.length) throw new Error('Provide at least --counting-method or --default-value');
      const [result] = await client.updateKeyEvent({
        keyEvent,
        updateMask: { paths: updateMask },
      });
      output({
        name: result.name,
        eventName: result.eventName,
        countingMethod: result.countingMethod,
      }, cmd.optsWithGlobals());
    }));

  keyEvents
    .command('delete <keyEventName>')
    .description('Delete a key event (full resource name: properties/X/keyEvents/Y)')
    .action(withErrorHandler(async (keyEventName, opts, cmd) => {
      const client = await getAdminClient();
      await client.deleteKeyEvent({ name: keyEventName });
      output({ deleted: keyEventName }, cmd.optsWithGlobals());
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
