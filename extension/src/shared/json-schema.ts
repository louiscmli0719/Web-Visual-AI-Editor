export const DATA_FORMAT_VERSION = "0.8" as const;
export const DATA_FORMAT_APP_NAME = "Web Visual AI Editor" as const;
export const SUPPORTED_IMPORT_VERSIONS = ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8"] as const;
export type SupportedImportVersion = (typeof SUPPORTED_IMPORT_VERSIONS)[number];
