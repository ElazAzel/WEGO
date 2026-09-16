const defaultBasePath = import.meta.env.BASE_URL;

export function withPublicBase(path: string, basePath = defaultBasePath): string {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  return `${normalizedBase}${path.replace(/^\/+/, "")}`;
}
