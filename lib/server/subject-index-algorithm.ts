import 'server-only';

export interface SubjectIndexEntry {
  subjectId: string;
  index: number;
}

export interface SubjectIndexPlan {
  assignedIndex: number;
  reindexed: boolean;
  entries: SubjectIndexEntry[];
  changed: SubjectIndexEntry[];
}

interface TenthsEntry {
  subjectId: string;
  tenths: number;
}

export function toTenths(value: number): number {
  return Math.round(value * 10);
}

export function fromTenths(tenths: number): number {
  return tenths / 10;
}

export function formatTenths(tenths: number): string {
  return (tenths / 10).toFixed(1);
}

export function bucketOf(tenths: number): number {
  return Math.floor(tenths / 10);
}

function toEntry(item: TenthsEntry): SubjectIndexEntry {
  return {
    subjectId: item.subjectId,
    index: fromTenths(item.tenths),
  };
}

function compareTenthsEntries(a: TenthsEntry, b: TenthsEntry): number {
  if (a.tenths !== b.tenths) {
    return a.tenths - b.tenths;
  }
  return a.subjectId.localeCompare(b.subjectId);
}

function normalizeSequential(items: readonly TenthsEntry[]): TenthsEntry[] {
  return items.map((item, idx) => ({
    subjectId: item.subjectId,
    tenths: (idx + 1) * 10,
  }));
}

/**
 * Calcula la actualización de índices (con precisión de una décima en décimas enteras)
 * resolviendo huecos entre enteros, colisiones hasta `.9` y reindexado completo a enteros.
 */
function computeSingleSubjectIndexUpdate(
  currentEntries: readonly SubjectIndexEntry[],
  subjectId: string,
  requestedIndex: number,
): SubjectIndexPlan {
  const allItems: TenthsEntry[] = currentEntries
    .map((entry) => ({
      subjectId: entry.subjectId,
      tenths: toTenths(entry.index),
    }))
    .sort(compareTenthsEntries);

  const previousBySubjectId = new Map<string, number>(
    allItems.map((entry) => [entry.subjectId, entry.tenths]),
  );

  const existingSelf = allItems.find((entry) => entry.subjectId === subjectId);
  const others = allItems.filter((entry) => entry.subjectId !== subjectId);
  const reqTenths = toTenths(requestedIndex);

  if (existingSelf && existingSelf.tenths === reqTenths) {
    return {
      assignedIndex: fromTenths(reqTenths),
      reindexed: false,
      entries: allItems.map(toEntry),
      changed: [],
    };
  }

  const reqBucket = bucketOf(reqTenths);
  const occupiedBuckets = new Set(others.map((entry) => bucketOf(entry.tenths)));
  const hasLowerInSameBucket = others.some(
    (entry) => bucketOf(entry.tenths) === reqBucket && entry.tenths < reqTenths,
  );

  let targetTenths: number;
  if (!hasLowerInSameBucket) {
    let effectiveBucket = reqBucket;
    while (effectiveBucket > 1 && !occupiedBuckets.has(effectiveBucket - 1)) {
      effectiveBucket -= 1;
    }

    if (effectiveBucket !== reqBucket || !occupiedBuckets.has(reqBucket)) {
      targetTenths = effectiveBucket * 10;
    } else {
      targetTenths = reqTenths;
    }
  } else {
    targetTenths = reqTenths;
  }

  if (existingSelf && existingSelf.tenths === targetTenths) {
    return {
      assignedIndex: fromTenths(targetTenths),
      reindexed: false,
      entries: allItems.map(toEntry),
      changed: [],
    };
  }

  const targetBucket = bucketOf(targetTenths);
  const bucketMaxTenths = targetBucket * 10 + 9;
  const byTenths = new Map<number, TenthsEntry>(
    others.map((entry) => [entry.tenths, entry]),
  );

  const chain: TenthsEntry[] = [];
  let cursor = targetTenths;
  while (byTenths.has(cursor)) {
    chain.push(byTenths.get(cursor)!);
    cursor += 1;
  }

  let finalItems: TenthsEntry[];
  let reindexed: boolean;

  if (cursor > bucketMaxTenths) {
    const ordered: TenthsEntry[] = [
      ...others.filter((entry) => entry.tenths < targetTenths),
      { subjectId, tenths: targetTenths },
      ...others.filter((entry) => entry.tenths >= targetTenths),
    ];
    finalItems = normalizeSequential(ordered);
    reindexed = true;
  } else {
    const shifted = new Set(chain.map((entry) => entry.subjectId));
    const nextItems: TenthsEntry[] = [
      ...others.map((entry) =>
        shifted.has(entry.subjectId)
          ? { subjectId: entry.subjectId, tenths: entry.tenths + 1 }
          : entry,
      ),
      { subjectId, tenths: targetTenths },
    ].sort(compareTenthsEntries);

    if (nextItems.length > 0 && bucketOf(nextItems[0].tenths) > 1) {
      finalItems = normalizeSequential(nextItems);
      reindexed = true;
    } else {
      finalItems = nextItems;
      reindexed = false;
    }
  }

  const changed = finalItems
    .filter((item) => previousBySubjectId.get(item.subjectId) !== item.tenths)
    .map(toEntry);
  const assignedItem = finalItems.find((item) => item.subjectId === subjectId)!;

  return {
    assignedIndex: fromTenths(assignedItem.tenths),
    reindexed,
    entries: finalItems.map(toEntry),
    changed,
  };
}

/**
 * Calcula la actualización de índices (con precisión de una décima en décimas enteras)
 * creando primero índices para las asignaturas previas sin índice si se proporcionan
 * y resolviendo huecos entre enteros, colisiones hasta `.9` y reindexado completo.
 */
export function computeSubjectIndexUpdate(
  currentEntries: readonly SubjectIndexEntry[],
  subjectId: string,
  requestedIndex: number,
  precedingSubjectIds: readonly string[] = [],
): SubjectIndexPlan {
  if (precedingSubjectIds.length === 0) {
    return computeSingleSubjectIndexUpdate(
      currentEntries,
      subjectId,
      requestedIndex,
    );
  }

  const initialTenthsBySubjectId = new Map<string, number>(
    currentEntries.map((entry) => [entry.subjectId, toTenths(entry.index)]),
  );

  let workingEntries: SubjectIndexEntry[] = currentEntries.map((entry) => ({
    subjectId: entry.subjectId,
    index: entry.index,
  }));
  const indexedSubjectIds = new Set(
    workingEntries.map((entry) => entry.subjectId),
  );

  let maxBucket = 0;
  for (const entry of workingEntries) {
    const bucket = bucketOf(toTenths(entry.index));
    if (bucket > maxBucket) {
      maxBucket = bucket;
    }
  }

  let anyReindexed = false;
  const seenPrecedingIds = new Set<string>();

  for (const precedingId of precedingSubjectIds) {
    if (precedingId === subjectId || seenPrecedingIds.has(precedingId)) {
      continue;
    }
    seenPrecedingIds.add(precedingId);

    if (indexedSubjectIds.has(precedingId)) {
      continue;
    }

    maxBucket += 1;
    const stepPlan = computeSingleSubjectIndexUpdate(
      workingEntries,
      precedingId,
      maxBucket,
    );
    workingEntries = stepPlan.entries;
    indexedSubjectIds.add(precedingId);
    maxBucket = Math.max(
      maxBucket,
      bucketOf(toTenths(stepPlan.assignedIndex)),
    );
    anyReindexed = anyReindexed || stepPlan.reindexed;
  }

  let maxPrecedingBucket = 0;
  for (const entry of workingEntries) {
    if (seenPrecedingIds.has(entry.subjectId)) {
      const bucket = bucketOf(toTenths(entry.index));
      if (bucket > maxPrecedingBucket) {
        maxPrecedingBucket = bucket;
      }
    }
  }

  const effectiveRequestedIndex =
    maxPrecedingBucket > 0
      ? Math.max(requestedIndex, maxPrecedingBucket + 1)
      : requestedIndex;

  const finalPlan = computeSingleSubjectIndexUpdate(
    workingEntries,
    subjectId,
    effectiveRequestedIndex,
  );

  const changed = finalPlan.entries.filter(
    (entry) =>
      initialTenthsBySubjectId.get(entry.subjectId) !== toTenths(entry.index),
  );

  return {
    assignedIndex: finalPlan.assignedIndex,
    reindexed: anyReindexed || finalPlan.reindexed,
    entries: finalPlan.entries,
    changed,
  };
}
