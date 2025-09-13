import { PermissionSetList } from './permission-set-list';

const permissions = PermissionSetList.flatMap(({ featureName, permission }) => {
  return permission.map((action) => {
    const ruleName = `${featureName}__${action}`.toLocaleUpperCase();
    return {
      [ruleName]: ruleName,
    };
  });
}).reduce((permission, obj) => {
  const [key, value] = Object.entries(obj)[0];
  permission[key] = value;
  return permission;
}, {});

console.log(permissions);
