import { FilterPill } from '../atoms';

export type AbsenceFilterValue = 'all' | 'unjustified' | 'justified';

export interface AbsenceFilterBarProps {
  value: AbsenceFilterValue;
  totalCount: number;
  unjustifiedCount: number;
  justifiedCount: number;
  onChange: (nextFilter: AbsenceFilterValue) => void;
}

export function AbsenceFilterBar({
  value,
  totalCount,
  unjustifiedCount,
  justifiedCount,
  onChange,
}: AbsenceFilterBarProps) {
  return (
    <div
      className="cf-filter-group"
      role="group"
      aria-label="Filtrar faltas por estado"
    >
      <FilterPill active={value === 'all'} onClick={() => onChange('all')}>
        Todas ({totalCount})
      </FilterPill>
      <FilterPill
        active={value === 'unjustified'}
        onClick={() => onChange('unjustified')}
      >
        Injustificadas ({unjustifiedCount})
      </FilterPill>
      <FilterPill
        active={value === 'justified'}
        onClick={() => onChange('justified')}
      >
        Justificadas ({justifiedCount})
      </FilterPill>
    </div>
  );
}
