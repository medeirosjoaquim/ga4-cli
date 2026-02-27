import { getAdminClient } from '../utils/client.js';
import { output } from '../output.js';
import { withErrorHandler } from '../utils/errors.js';

/** @param {import('commander').Command} program */
export function registerUsers(program) {
  const users = program.command('users').description('View user permissions');

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
}
