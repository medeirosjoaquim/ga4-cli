#!/usr/bin/env node

import { Command } from 'commander';
import { login, logout, whoami } from './auth.js';
import { loadConfig, saveConfig } from './config.js';
import { output } from './output.js';
import { withErrorHandler } from './utils/errors.js';
import { registerAccounts } from './commands/accounts.js';
import { registerProperties } from './commands/properties.js';
import { registerStreams } from './commands/streams.js';
import { registerConfigAdmin } from './commands/config-admin.js';
import { registerLinks } from './commands/links.js';
import { registerSettings } from './commands/settings.js';
import { registerUsers } from './commands/users.js';
import { registerReport } from './commands/report.js';
import { registerMetadata } from './commands/metadata.js';
import { registerBatch } from './commands/batch.js';

const program = new Command();

program
  .name('analytics-cli')
  .description('Google Analytics CLI — Full read access to GA4 data')
  .version('1.0.0')
  .option('--json', 'Output raw JSON')
  .option('--csv', 'Output as CSV')
  .option('--output <filepath>', 'Write output to file')
  .option('--property <id>', 'Set default property (saved to config)')
  .option('--verbose', 'Show full error stack traces');

// Save default property when --property is used
program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.property) {
    const prop = opts.property.startsWith('properties/') ? opts.property : `properties/${opts.property}`;
    saveConfig({ defaultProperty: prop });
  }
});

// Auth commands
program
  .command('login')
  .description('Authenticate with Google OAuth')
  .action(withErrorHandler(async () => {
    await login();
    console.log('Login successful!');
  }));

program
  .command('logout')
  .description('Clear stored tokens')
  .action(() => logout());

program
  .command('whoami')
  .description('Show current authenticated user')
  .action(withErrorHandler(async (opts, cmd) => {
    const user = await whoami();
    output({ email: user.email, name: user.name, picture: user.picture }, cmd.optsWithGlobals());
  }));

// Register all command groups
registerAccounts(program);
registerProperties(program);
registerStreams(program);
registerConfigAdmin(program);
registerLinks(program);
registerSettings(program);
registerUsers(program);
registerReport(program);
registerBatch(program);
registerMetadata(program);

program.parse();
