'use client';

import { useState, type MouseEvent } from 'react';
import { Badge, Text } from '../atoms';
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
  maxAllowedHours: number;
  currentPercentage: number;
  remainingHours: number;
  convalidated: boolean;
}

export interface SubjectMenuItemProps {
  subject: SubjectSummaryItem;
  pendingHours: QuickAbsenceHours | null;
  pendingConvalidation: boolean;
  disabled: boolean;
  onAddAbsence: (subjectId: string, hours: QuickAbsenceHours) => void;
  onToggleConvalidate: (subjectId: string, nextConvalidated: boolean) => void;
}

export function SubjectMenuItem({
  subject,
  pendingHours,
  pendingConvalidation,
  disabled,
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
      className="cf-subject-item"
      data-tone={!subject.convalidated && isExceeded ? 'error' : 'neutral'}
      data-convalidated={subject.convalidated ? 'true' : 'false'}
      onContextMenu={handleContextMenu}
    >
      <div className="cf-subject-main">
        <Text as="span" variant="strong" className="cf-subject-name">
          {subject.name}
        </Text>
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
            onToggleConvalidate={onToggleConvalidate}
          />
        </div>
      </div>

      <SubjectAbsenceMetrics
        totalHours={subject.totalHours}
        missedHours={subject.missedHours}
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
