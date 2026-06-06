// Shared sync flags — avoids circular dependency between cloudSync.ts and useCloudSync.ts
let _suppressSyncEvents = false;

export function suppressSyncEvents(suppress: boolean) {
  _suppressSyncEvents = suppress;
}

export function isSyncSuppressed(): boolean {
  return _suppressSyncEvents;
}
