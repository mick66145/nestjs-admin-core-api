export const PermissionAction = {
  VIEW: 'VIEW',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export type PermissionAction =
  (typeof PermissionAction)[keyof typeof PermissionAction];

export const PermissionActionName = {
  [PermissionAction.VIEW]: '檢視',
  [PermissionAction.CREATE]: '新增',
  [PermissionAction.UPDATE]: '編輯',
  [PermissionAction.DELETE]: '刪除',
} as const;

export type PermissionActionName =
  (typeof PermissionActionName)[keyof typeof PermissionActionName];

export type PermissionSet = {
  featureName: string;
  displayName: string;
  permission: PermissionAction[];
};

export const PermissionSetList: PermissionSet[] = [
  {
    featureName: 'member',
    displayName: '管理員管理',
    permission: [
      PermissionAction.VIEW,
      PermissionAction.CREATE,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ],
  },
  {
    featureName: 'role',
    displayName: '角色管理',
    permission: [
      PermissionAction.VIEW,
      PermissionAction.CREATE,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ],
  },
] as const;
