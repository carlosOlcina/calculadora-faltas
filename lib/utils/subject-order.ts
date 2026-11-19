export interface SubjectIndexMapItem {
  subjectId: string;
  index: number;
}

export function sortSubjectsByIndex<
  T extends { name: string; index: number | null },
>(subjects: readonly T[]): T[] {
  return [...subjects].sort((a, b) => {
    if (a.index !== null && b.index !== null) {
      if (a.index !== b.index) {
        return a.index - b.index;
      }
      return a.name.localeCompare(b.name, 'es');
    }

    if (a.index !== null) {
      return -1;
    }

    if (b.index !== null) {
      return 1;
    }

    return a.name.localeCompare(b.name, 'es');
  });
}

export function applySubjectIndices<
  T extends { id: string; name: string; index: number | null },
>(subjects: readonly T[], indices: readonly SubjectIndexMapItem[]): T[] {
  const indexBySubjectId = new Map<string, number>(
    indices.map((entry) => [entry.subjectId, entry.index]),
  );

  const updated = subjects.map((subject) => ({
    ...subject,
    index: indexBySubjectId.get(subject.id) ?? null,
  }));

  return sortSubjectsByIndex(updated);
}

function moveArrayItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export interface SubjectDropReorderPlan {
  subjectId: string;
  requestedIndex: number;
  precedingSubjectIds: string[];
}

export function computeDropReorderPlan(
  orderedSubjects: ReadonlyArray<{ id: string; index: number | null }>,
  activeId: string,
  overId: string,
): SubjectDropReorderPlan | null {
  const oldIndex = orderedSubjects.findIndex((item) => item.id === activeId);
  const newIndex = orderedSubjects.findIndex((item) => item.id === overId);

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return null;
  }

  const reordered = moveArrayItem(orderedSubjects, oldIndex, newIndex);
  const precedingSubjectIds = reordered
    .slice(0, newIndex)
    .filter((subject) => subject.index === null)
    .map((subject) => subject.id);

  let maxIndexedBucket = 0;
  for (const subject of orderedSubjects) {
    if (subject.index !== null) {
      const bucket = Math.floor(subject.index);
      if (bucket > maxIndexedBucket) {
        maxIndexedBucket = bucket;
      }
    }
  }

  if (precedingSubjectIds.length > 0) {
    return {
      subjectId: activeId,
      requestedIndex: maxIndexedBucket + precedingSubjectIds.length + 1,
      precedingSubjectIds,
    };
  }

  const prev = newIndex > 0 ? reordered[newIndex - 1] : null;
  const next = newIndex < reordered.length - 1 ? reordered[newIndex + 1] : null;

  let requestedIndex: number;
  if (next && next.index !== null) {
    requestedIndex = next.index;
  } else if (prev && prev.index !== null) {
    requestedIndex = Math.floor(prev.index) + 1;
  } else {
    requestedIndex =
      maxIndexedBucket === 0
        ? newIndex + 1
        : Math.max(newIndex + 1, maxIndexedBucket + 1);
  }

  return {
    subjectId: activeId,
    requestedIndex,
    precedingSubjectIds: [],
  };
}

export function computeRequestedIndexForDrop(
  orderedSubjects: ReadonlyArray<{ id: string; index: number | null }>,
  activeId: string,
  overId: string,
): number | null {
  return (
    computeDropReorderPlan(orderedSubjects, activeId, overId)
      ?.requestedIndex ?? null
  );
}
