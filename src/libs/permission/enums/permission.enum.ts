export const Permission = {
  // 會員管理
  MEMBER__VIEW: 'MEMBER__VIEW',
  MEMBER__CREATE: 'MEMBER__CREATE',
  MEMBER__UPDATE: 'MEMBER__UPDATE',
  MEMBER__DELETE: 'MEMBER__DELETE',

  // 角色管理
  ROLE__VIEW: 'ROLE__VIEW',
  ROLE__CREATE: 'ROLE__CREATE',
  ROLE__UPDATE: 'ROLE__UPDATE',
  ROLE__DELETE: 'ROLE__DELETE',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
