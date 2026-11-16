import { Badge, Text } from '../atoms';
import {
  QuickAbsenceControl,
  type QuickAbsenceHours,
} from './QuickAbsenceControl';
import { SubjectAbsenceMetrics } from './SubjectAbsenceMetrics';

export interface SubjectSummaryItem {
  id: string;
  name: string;
  totalHours: number;
  missedHours: number;
  maxAllowedHours: number;
  currentPercentage: number;
  remainingHours: number;
}

export interface SubjectMenuItemProps {
  subject: SubjectSummaryItem;
  pendingHours: QuickAbsenceHours | null;
  disabled: boolean;
  onAddAbsence: (subjectId: string, hours: QuickAbsenceHours) => void;
}

export function SubjectMenuItem({
  subject,
  pendingHours,
  disabled,
  onAddAbsence,
}: SubjectMenuItemProps) {
  return (
    <li className="cf-subject-item">
      <div className="cf-subject-main">
        <Text as="span" variant="strong">
          {subject.name}
        </Text>
        <Badge mono>{subject.totalHours} h</Badge>
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
        disabled={disabled}
        onAddAbsence={onAddAbsence}
      />
    </li>
  );
}
