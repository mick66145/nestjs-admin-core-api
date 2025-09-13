export interface IFileStorageStrategy {
  save(
    directory: string,
    fileName: string,
    buffer: Buffer,
    options?: {
      contentDisposition?: string;
      contentType?: string;
    },
  ): Promise<void>;
  getPublicDownloadUrl(directory: string, fileName: string): string;
}

export interface IFileStorageDownloadStrategy {
  download(directory: string, fileName: string): Promise<Buffer>;
  downloadByPublicUrl?(filePath: string): Promise<Buffer>;
}
