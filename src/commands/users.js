import { getAdminClient } from '../utils/client.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} program */
export function registerUsers(program) {
  const users = program.command('users').description('View user permissions');
  function collect(val, arr) { arr.push(val); return arr; }

  users
    .command('list-account <accountId>')
    .description('List users on account')
    .action(withErrorHandler(async (accountId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`;
      const [response] = await client.listAccountUserLinks({ parent });
      const data = response.map(l => ({
        name: l.name,
        emailAddress: l.emailAddress,
        directRoles: l.directRoles?.join(', '),
      }));
      output(data, cmd.optsWithGlobals());
    }));

  users
    .command('list-property <propertyId>')
    .description('List users on property')
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [response] = await client.listPropertyUserLinks({ parent });
      const data = response.map(l => ({
        name: l.name,
        emailAddress: l.emailAddress,
        directRoles: l.directRoles?.join(', '),
      }));
      output(data, cmd.optsWithGlobals());
    }));

  users
    .command('get-account <accountId> <linkId>')
    .description('Get specific account user binding')
    .action(withErrorHandler(async (accountId, linkId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`;
      const name = `${parent}/userLinks/${linkId}`;
      const [link] = await client.getAccountUserLink({ name });
      output({
        name: link.name,
        emailAddress: link.emailAddress,
        directRoles: link.directRoles?.join(', '),
      }, cmd.optsWithGlobals());
    }));

  users
    .command('get-property <propertyId> <linkId>')
    .description('Get specific property user binding')
    .action(withErrorHandler(async (propertyId, linkId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/userLinks/${linkId}`;
      const [link] = await client.getPropertyUserLink({ name });
      output({
        name: link.name,
        emailAddress: link.emailAddress,
        directRoles: link.directRoles?.join(', '),
      }, cmd.optsWithGlobals());
    }));

  users
    .command('create-account <accountId>')
    .description('Create a user access binding on an account')
    .requiredOption('--email <email>', 'User email address')
    .option('--roles <role>', 'Role (repeatable, e.g. predefinedRoles/viewer)', collect, [])
    .action(withErrorHandler(async (accountId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`;
      const [binding] = await client.createAccessBinding({
        parent,
        accessBinding: { user: opts.email, roles: opts.roles },
      });
      output({
        name: binding.name,
        user: binding.user,
        roles: binding.roles?.join(', '),
      }, cmd.optsWithGlobals());
    }));

  users
    .command('create-property <propertyId>')
    .description('Create a user access binding on a property')
    .requiredOption('--email <email>', 'User email address')
    .option('--roles <role>', 'Role (repeatable)', collect, [])
    .action(withErrorHandler(async (propertyId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const [binding] = await client.createAccessBinding({
        parent,
        accessBinding: { user: opts.email, roles: opts.roles },
      });
      output({
        name: binding.name,
        user: binding.user,
        roles: binding.roles?.join(', '),
      }, cmd.optsWithGlobals());
    }));

  users
    .command('update-account <accountId> <bindingId>')
    .description('Update a user access binding on an account')
    .option('--roles <role>', 'Role (repeatable)', collect, [])
    .action(withErrorHandler(async (accountId, bindingId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`;
      const name = `${parent}/accessBindings/${bindingId}`;
      if (!opts.roles.length) throw new Error('Provide at least one --roles');
      const [binding] = await client.updateAccessBinding({
        accessBinding: { name, roles: opts.roles },
      });
      output({
        name: binding.name,
        user: binding.user,
        roles: binding.roles?.join(', '),
      }, cmd.optsWithGlobals());
    }));

  users
    .command('update-property <propertyId> <bindingId>')
    .description('Update a user access binding on a property')
    .option('--roles <role>', 'Role (repeatable)', collect, [])
    .action(withErrorHandler(async (propertyId, bindingId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/accessBindings/${bindingId}`;
      if (!opts.roles.length) throw new Error('Provide at least one --roles');
      const [binding] = await client.updateAccessBinding({
        accessBinding: { name, roles: opts.roles },
      });
      output({
        name: binding.name,
        user: binding.user,
        roles: binding.roles?.join(', '),
      }, cmd.optsWithGlobals());
    }));

  users
    .command('delete-account <accountId> <bindingId>')
    .description('Delete a user access binding on an account')
    .action(withErrorHandler(async (accountId, bindingId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`;
      const name = `${parent}/accessBindings/${bindingId}`;
      await client.deleteAccessBinding({ name });
      output({ deleted: name }, cmd.optsWithGlobals());
    }));

  users
    .command('delete-property <propertyId> <bindingId>')
    .description('Delete a user access binding on a property')
    .action(withErrorHandler(async (propertyId, bindingId, opts, cmd) => {
      const client = await getAdminClient();
      const parent = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
      const name = `${parent}/accessBindings/${bindingId}`;
      await client.deleteAccessBinding({ name });
      output({ deleted: name }, cmd.optsWithGlobals());
    }));
}
