export interface E8dConfigInterface {
  UID: string;
  PWD: string;
  apiSite: string;
}

export interface GoogleMailConfigInterface {
  smtp: {
    host: string;
    port: number;
  };
  email: string;
  password: string;
}

export interface GoogleLoginConfigInterface {
  webClientId: string;
  iosClientId: string;
  androidClientId: string;
}

export interface LineLoginConfigInterface {
  channelId: string;
}

export interface GoogleCloudStorageConfigInterface {
  projectId: string;
  privateKey: string;
  clientEmail: string;
  bucketName: string;
}

export interface ThirdPartyConfigInterface {
  e8d: E8dConfigInterface;
  googleMail: GoogleMailConfigInterface;
  googleLogin: GoogleLoginConfigInterface;
  lineLogin: LineLoginConfigInterface;
  googleCloudStorage: GoogleCloudStorageConfigInterface;
}
