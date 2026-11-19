'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties } from 'react';
import {
  SubjectMenuItem,
  type SubjectMenuItemProps,
} from './SubjectMenuItem';

export interface SortableSubjectMenuItemProps
  extends Omit<
    SubjectMenuItemProps,
    'itemRef' | 'itemStyle' | 'isDragging' | 'dragHandleProps'
  > {
  reorderDisabled: boolean;
}

export function SortableSubjectMenuItem({
  subject,
  reorderDisabled,
  pendingReorder = false,
  ...props
}: SortableSubjectMenuItemProps) {
  const isDragDisabled = reorderDisabled || pendingReorder;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subject.id,
    disabled: isDragDisabled,
  });

  const transformValue = CSS.Transform.toString(transform);
  const itemStyle: CSSProperties | undefined =
    transformValue || transition
      ? {
          ...(transformValue ? { transform: transformValue } : {}),
          ...(transition ? { transition } : {}),
        }
      : undefined;

  return (
    <SubjectMenuItem
      {...props}
      subject={subject}
      pendingReorder={pendingReorder}
      itemRef={setNodeRef}
      itemStyle={itemStyle}
      isDragging={isDragging}
      dragHandleProps={{
        ref: setActivatorNodeRef,
        ...attributes,
        ...listeners,
        disabled: isDragDisabled,
        'aria-label': `Reordenar ${subject.name}`,
      }}
    />
  );
}
