'use client';

import Link from 'next/link';
import {
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type MouseEvent,
  type Ref,
} from 'react';
import { Badge, Icon, IconButton, Text } from '../atoms';
import type { ContextMenuPointEvent } from './contextMenuDom';
import {
  QuickAbsenceControl,
  type QuickAbsenceHours,
} from './QuickAbsenceControl';
import { SubjectAbsenceMetrics } from './SubjectAbsenceMetrics';
import { SubjectContextMenu } from './SubjectContextMenu';

export interface SubjectSummaryItem {
  id: string;
  name: string;
  totalHours: number;
  missedHours: number;
  justifiedHours: number;
  maxAllowedHours: number;
  currentPercentage: number;
  remainingHours: number;
  convalidated: boolean;
  index: number | null;
}

export type DragHandleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: Ref<HTMLButtonElement>;
};

export interface SubjectMenuItemProps {
  subject: SubjectSummaryItem;
  pendingHours: QuickAbsenceHours | null;
  pendingConvalidation: boolean;
  pendingReorder?: boolean;
  disabled: boolean;
  itemRef?: Ref<HTMLLIElement>;
  itemStyle?: CSSProperties;
  isDragging?: boolean;
  dragHandleProps?: DragHandleButtonProps;
  onViewDetails: (subjectId: string) => void;
  onAddAbsence: (subjectId: string, hours: QuickAbsenceHours) => void;
  onToggleConvalidate: (subjectId: string, nextConvalidated: boolean) => void;
}

export function SubjectMenuItem({
  subject,
  pendingHours,
  pendingConvalidation,
  pendingReorder = false,
  disabled,
  itemRef,
  itemStyle,
  isDragging = false,
  dragHandleProps,
  onViewDetails,
  onAddAbsence,
  onToggleConvalidate,
}: SubjectMenuItemProps) {
  const [contextMenuEvent, setContextMenuEvent] =
    useState<ContextMenuPointEvent | null>(null);
  const isExceeded = subject.missedHours > subject.maxAllowedHours;

  const handleContextMenu = (event: MouseEvent<HTMLLIElement>) => {
    event.preventDefault();
    setContextMenuEvent((prev) => ({
      clientX: event.clientX,
      clientY: event.clientY,
      timestamp: Math.max(Date.now(), (prev?.timestamp ?? 0) + 1),
    }));
  };

  return (
    <li
      ref={itemRef}
      style={itemStyle}
      className="cf-subject-item"
      data-tone={!subject.convalidated && isExceeded ? 'error' : 'neutral'}
      data-convalidated={subject.convalidated ? 'true' : 'false'}
      data-dragging={isDragging ? 'true' : 'false'}
      onContextMenu={handleContextMenu}
    >
      <div className="cf-subject-main">
        <div className="cf-subject-title-group">
          {dragHandleProps ? (
            <IconButton
              {...dragHandleProps}
              variant="drag-handle"
              disabled={Boolean(dragHandleProps.disabled) || pendingReorder}
            >
              <Icon name={pendingReorder ? 'spinner' : 'grip-vertical'} />
            </IconButton>
          ) : null}
          <Text as="span" variant="strong" className="cf-subject-name">
            <Link
              href={`/subjects/${subject.id}`}
              className="cf-subject-card-link"
            >
              {subject.name}
            </Link>
          </Text>
        </div>
        <div className="cf-subject-header-actions">
          {subject.convalidated ? <Badge>Convalidada</Badge> : null}
          <Badge mono>{subject.totalHours} h</Badge>
          <SubjectContextMenu
            subjectId={subject.id}
            subjectName={subject.name}
            convalidated={subject.convalidated}
            pending={pendingConvalidation}
            disabled={disabled}
            contextMenuEvent={contextMenuEvent}
            onViewDetails={onViewDetails}
            onToggleConvalidate={onToggleConvalidate}
          />
        </div>
      </div>

      <SubjectAbsenceMetrics
        totalHours={subject.totalHours}
        missedHours={subject.missedHours}
        justifiedHours={subject.justifiedHours}
        maxAllowedHours={subject.maxAllowedHours}
        currentPercentage={subject.currentPercentage}
        remainingHours={subject.remainingHours}
      />

      <QuickAbsenceControl
        subjectId={subject.id}
        subjectName={subject.name}
        pendingHours={pendingHours}
        disabled={disabled || subject.convalidated || pendingConvalidation}
        onAddAbsence={onAddAbsence}
      />
    </li>
  );
}
