export const Permission = {
  // 管理員管理
  USER__VIEW: 'USER__VIEW',
  USER__CREATE: 'USER__CREATE',
  USER__UPDATE: 'USER__UPDATE',
  USER__DELETE: 'USER__DELETE',

  // 角色管理
  ROLE__VIEW: 'ROLE__VIEW',
  ROLE__CREATE: 'ROLE__CREATE',
  ROLE__UPDATE: 'ROLE__UPDATE',
  ROLE__DELETE: 'ROLE__DELETE',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
