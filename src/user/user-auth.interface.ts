export type JwtPayload = {
  sub: string;
  username: string;
  iat: number;
  exp: number;
  refreshExp: number;
};

export type SignPayload = {
  sub: string;
  username: string;
  refreshExp: number;
};

export type ThirtPartyPayload = {
  name: string;
  phone?: string;
  email?: string;
};

export interface AuthDataConfig {
  payload: JwtPayload;
  token: string;
}
