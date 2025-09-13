export interface IFileStorageStrategy {
  save(
    filePath: string,
    buffer: Buffer,
    options?: {
      contentDisposition?: string;
      contentType?: string;
    },
  ): Promise<void>;
  getPublicDownloadUrl(filePath: string): string;
}

export interface IFileStorageDownloadStrategy {
  download(filePath: string): Promise<Buffer>;
  downloadByPublicUrl?(filePath: string): Promise<Buffer>;
}
