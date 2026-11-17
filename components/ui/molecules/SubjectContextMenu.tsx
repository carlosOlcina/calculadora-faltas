'use client';

import { useId, type MouseEvent } from 'react';
import { Icon, IconButton } from '../atoms';
import { useSubjectContextMenu, type ContextMenuPointEvent } from './contextMenuDom';

export interface SubjectContextMenuProps {
  subjectId: string;
  subjectName: string;
  convalidated: boolean;
  pending: boolean;
  disabled: boolean;
  contextMenuEvent: ContextMenuPointEvent | null;
  onViewDetails: (subjectId: string) => void;
  onToggleConvalidate: (subjectId: string, nextConvalidated: boolean) => void;
}

export function SubjectContextMenu({
  subjectId,
  subjectName,
  convalidated,
  pending,
  disabled,
  contextMenuEvent,
  onViewDetails,
  onToggleConvalidate,
}: SubjectContextMenuProps) {
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const menuId = `${baseId}-menu`;
  const isActionDisabled = disabled || pending;
  const {
    triggerRef, popoverRef, groupRef, isOpen, closeFromItem,
    handleTriggerPointerDown, handleTriggerClick, handleTriggerKeyDown,
    handlePopoverKeyDown, handleItemPointerMove,
  } = useSubjectContextMenu(contextMenuEvent, isActionDisabled);

  const handleDetailsAction = (event: MouseEvent<HTMLButtonElement>) => {
    closeFromItem(event.detail !== 0);
    onViewDetails(subjectId);
  };

  const handleAction = (event: MouseEvent<HTMLButtonElement>) => {
    closeFromItem(event.detail !== 0);
    onToggleConvalidate(subjectId, !convalidated);
  };

  return (
    <>
      <IconButton
        id={triggerId}
        ref={triggerRef}
        variant="menu-trigger"
        disabled={isActionDisabled}
        aria-label={`Opciones de ${subjectName}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onPointerDown={handleTriggerPointerDown}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        {...({ commandfor: menuId, command: 'toggle-popover' } as Record<string, string>)}
      >
        <Icon name={pending ? 'spinner' : 'more-vertical'} />
      </IconButton>

      <div
        id={menuId}
        ref={popoverRef}
        popover="auto"
        tabIndex={-1}
        className="cf-context-menu-popover"
        onKeyDown={handlePopoverKeyDown}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div
          ref={groupRef}
          aria-labelledby={triggerId}
          className="cf-context-menu"
          {...({ focusgroup: 'menu nomemory' } as Record<string, string>)}
        >
          <button
            type="button"
            className="cf-context-menu-item"
            disabled={isActionDisabled}
            onPointerMove={handleItemPointerMove}
            onClick={handleDetailsAction}
          >
            <Icon name="file-text" />
            <span>Ver detalles</span>
          </button>
          <button
            type="button"
            className="cf-context-menu-item"
            disabled={isActionDisabled}
            onPointerMove={handleItemPointerMove}
            onClick={handleAction}
          >
            <Icon name={pending ? 'spinner' : convalidated ? 'rotate-ccw' : 'check'} />
            <span>{convalidated ? 'Desconvalidar asignatura' : 'Convalidar asignatura'}</span>
          </button>
        </div>
      </div>
    </>
  );
}
