export function getFileExt(fullName: string): string | null {
  const extRegex = /(?:\.([^.]+))$/;
  const [, fileExt] = extRegex.exec(fullName) ?? [];

  return fileExt !== undefined ? fileExt : null;
}

export function getFilePath(fullPath: string): Array<string> {
  const pathRegex = /([^\/]+)/;

  return pathRegex.exec(fullPath) ?? [];
}

export function formatFileName(originalname: string) {
  let filename = originalname;
  if (!/[^\u0000-\u00ff]/.test(filename)) {
    filename = Buffer.from(originalname, 'latin1').toString('utf8');
  }

  return filename;
}
