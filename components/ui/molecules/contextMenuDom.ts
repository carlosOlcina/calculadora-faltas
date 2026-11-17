'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

export interface ContextMenuPointEvent {
  clientX: number;
  clientY: number;
  timestamp: number;
}

interface ExtendedFocusOptions extends FocusOptions {
  focusVisible?: boolean;
}

interface ExtendedPopoverElement extends HTMLElement {
  showPopover: (options?: { source?: HTMLElement }) => void;
  hidePopover: () => void;
}

const VIEWPORT_PADDING = 8;
const FALLBACK_MENU_WIDTH = 224;
const FALLBACK_MENU_HEIGHT = 56;
const TRIGGER_OFFSET = 4;

export function supportsAnchorPositioning(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('position-area: block-end')
  );
}

export function supportsInvokerCommands(): boolean {
  return (
    typeof HTMLButtonElement !== 'undefined' &&
    'commandForElement' in HTMLButtonElement.prototype
  );
}

function focusElement(el: HTMLElement | null, withRing: boolean): void {
  if (!el) return;
  const options: ExtendedFocusOptions = withRing
    ? { preventScroll: true }
    : { preventScroll: true, focusVisible: false };
  el.focus(options);
}

function showPopoverSafely(popover: HTMLElement, source: HTMLElement): void {
  const el = popover as ExtendedPopoverElement;
  if (typeof el.showPopover !== 'function') return;
  try {
    el.showPopover({ source });
  } catch {
    el.showPopover();
  }
}

function hidePopoverSafely(popover: HTMLElement): void {
  const el = popover as ExtendedPopoverElement;
  if (typeof el.hidePopover !== 'function') return;
  if (popover.matches(':popover-open')) {
    el.hidePopover();
  }
}

export function clampMenuPoint(
  clientX: number,
  clientY: number,
  menuEl: HTMLElement,
): { x: number; y: number } {
  const width = menuEl.offsetWidth || FALLBACK_MENU_WIDTH;
  const height = menuEl.offsetHeight || FALLBACK_MENU_HEIGHT;
  const maxX = Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING);
  const maxY = Math.max(VIEWPORT_PADDING, window.innerHeight - height - VIEWPORT_PADDING);

  const rawX = clientX + width + VIEWPORT_PADDING > window.innerWidth ? clientX - width : clientX;
  const rawY = clientY + height + VIEWPORT_PADDING > window.innerHeight ? clientY - height : clientY;

  return {
    x: Math.min(Math.max(VIEWPORT_PADDING, rawX), maxX),
    y: Math.min(Math.max(VIEWPORT_PADDING, rawY), maxY),
  };
}

function positionBelowTrigger(popover: HTMLElement, trigger: HTMLElement): void {
  const rect = trigger.getBoundingClientRect();
  const width = popover.offsetWidth || FALLBACK_MENU_WIDTH;
  const height = popover.offsetHeight || FALLBACK_MENU_HEIGHT;

  const fitsBelow = rect.bottom + TRIGGER_OFFSET + height + VIEWPORT_PADDING <= window.innerHeight;
  const rawY = fitsBelow ? rect.bottom + TRIGGER_OFFSET : rect.top - TRIGGER_OFFSET - height;
  const rawX = rect.right - width;

  const maxX = Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING);
  const maxY = Math.max(VIEWPORT_PADDING, window.innerHeight - height - VIEWPORT_PADDING);

  popover.style.setProperty('--menu-x', `${Math.min(Math.max(VIEWPORT_PADDING, rawX), maxX)}px`);
  popover.style.setProperty('--menu-y', `${Math.min(Math.max(VIEWPORT_PADDING, rawY), maxY)}px`);
}

export function openMenuAtPoint(
  popover: HTMLElement,
  trigger: HTMLButtonElement,
  clientX: number,
  clientY: number,
): void {
  popover.setAttribute('data-positioned', 'point');
  if (!popover.matches(':popover-open')) {
    showPopoverSafely(popover, trigger);
  }
  const { x, y } = clampMenuPoint(clientX, clientY, popover);
  popover.style.setProperty('--menu-x', `${x}px`);
  popover.style.setProperty('--menu-y', `${y}px`);
}

export function openMenuFromTrigger(
  popover: HTMLElement,
  trigger: HTMLButtonElement,
): void {
  popover.removeAttribute('data-positioned');
  if (!popover.matches(':popover-open')) {
    showPopoverSafely(popover, trigger);
  }
  if (!supportsAnchorPositioning()) {
    positionBelowTrigger(popover, trigger);
  }
}

export function closeAndRestoreMenu(
  popover: HTMLElement,
  restoreTarget: HTMLElement | null,
  fromPointer: boolean,
): void {
  focusElement(restoreTarget, !fromPointer);
  hidePopoverSafely(popover);
}

function getEnabledMenuItems(group: HTMLElement | null): HTMLButtonElement[] {
  if (!group) return [];
  return Array.from(group.querySelectorAll<HTMLButtonElement>('button')).filter(
    (item) =>
      item.closest('[focusgroup]') === group &&
      !item.disabled &&
      item.getAttribute('aria-disabled') !== 'true',
  );
}

export function applyFocusgroupFallback(group: HTMLElement): () => void {
  if ('focusGroup' in HTMLElement.prototype) {
    return () => {};
  }

  group.setAttribute('role', 'menu');
  group.querySelectorAll('button:not([role])').forEach((item) => {
    item.setAttribute('role', 'menuitem');
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = getEnabledMenuItems(group);
    if (items.length === 0) return;

    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;

    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (current + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length;

    event.preventDefault();
    event.stopImmediatePropagation();
    items[next].focus({ preventScroll: true });
  };

  group.addEventListener('keydown', onKeyDown, true);
  return () => group.removeEventListener('keydown', onKeyDown, true);
}

export function useSubjectContextMenu(
  contextMenuEvent: ContextMenuPointEvent | null,
  disabled: boolean,
) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const enterOnOpenRef = useRef(false);
  const openAtPointRef = useRef(false);
  const pointerPressedRef = useRef(false);
  const openedViaPointRef = useRef(false);
  const restoreTargetRef = useRef<HTMLElement | null>(null);
  const lastTimestampRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    return applyFocusgroupFallback(group);
  }, []);

  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;

    const handleBeforeToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === 'open' && !openAtPointRef.current) {
        popover.removeAttribute('data-positioned');
      }
    };

    const handleToggle = (event: Event) => {
      const nextOpen = (event as ToggleEvent).newState === 'open';
      setIsOpen(nextOpen);

      if (nextOpen) {
        const wasPointOpen = openAtPointRef.current;
        openAtPointRef.current = false;

        if (!wasPointOpen && !supportsAnchorPositioning() && triggerRef.current) {
          positionBelowTrigger(popover, triggerRef.current);
        }

        if (enterOnOpenRef.current) {
          enterOnOpenRef.current = false;
          pointerPressedRef.current = false;
          getEnabledMenuItems(groupRef.current)[0]?.focus({ preventScroll: true });
        } else if (pointerPressedRef.current) {
          pointerPressedRef.current = false;
          focusElement(triggerRef.current, false);
        } else if (openedViaPointRef.current) {
          popover.focus({ preventScroll: true });
        }
        return;
      }

      enterOnOpenRef.current = false;
      pointerPressedRef.current = false;
      openAtPointRef.current = false;
    };

    popover.addEventListener('beforetoggle', handleBeforeToggle);
    popover.addEventListener('toggle', handleToggle);
    return () => {
      popover.removeEventListener('beforetoggle', handleBeforeToggle);
      popover.removeEventListener('toggle', handleToggle);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (!popover) return;

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Node | null;
      if (target && !popover.contains(target) && target !== trigger) {
        hidePopoverSafely(popover);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [isOpen]);

  useEffect(() => {
    if (!contextMenuEvent || contextMenuEvent.timestamp === lastTimestampRef.current) return;
    lastTimestampRef.current = contextMenuEvent.timestamp;
    if (disabled) return;

    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (!popover || !trigger) return;

    restoreTargetRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (contextMenuEvent.clientX === 0 && contextMenuEvent.clientY === 0) {
      openedViaPointRef.current = false;
      enterOnOpenRef.current = true;
      openMenuFromTrigger(popover, trigger);
      return;
    }

    openedViaPointRef.current = true;
    openAtPointRef.current = true;
    openMenuAtPoint(popover, trigger, contextMenuEvent.clientX, contextMenuEvent.clientY);
    if (popover.matches(':popover-open')) {
      openAtPointRef.current = false;
    }
  }, [contextMenuEvent, disabled]);

  const handleTriggerPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    pointerPressedRef.current = true;
    openedViaPointRef.current = false;
  };

  const handleTriggerClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (!popover || !trigger) return;

    openedViaPointRef.current = false;
    restoreTargetRef.current = trigger;

    if (!supportsInvokerCommands()) {
      event.preventDefault();
      if (popover.matches(':popover-open')) {
        closeAndRestoreMenu(popover, trigger, event.detail !== 0);
      } else {
        enterOnOpenRef.current = event.detail === 0;
        openMenuFromTrigger(popover, trigger);
      }
      return;
    }

    if (!popover.matches(':popover-open')) {
      enterOnOpenRef.current = event.detail === 0;
    }
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();

    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (!popover || !trigger) return;

    if (popover.matches(':popover-open')) {
      getEnabledMenuItems(groupRef.current)[0]?.focus({ preventScroll: true });
      return;
    }

    enterOnOpenRef.current = true;
    pointerPressedRef.current = false;
    trigger.click();
  };

  const handlePopoverKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (!popover) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      const target = openedViaPointRef.current
        ? (restoreTargetRef.current ?? trigger)
        : trigger;
      closeAndRestoreMenu(popover, target, openedViaPointRef.current);
      return;
    }

    if (event.key === 'Tab') {
      hidePopoverSafely(popover);
      return;
    }

    const items = getEnabledMenuItems(groupRef.current);
    if (items.length === 0) return;

    if (event.key === 'Home') {
      event.preventDefault();
      items[0].focus({ preventScroll: true });
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1].focus({ preventScroll: true });
    } else if (
      document.activeElement === popover &&
      (event.key === 'ArrowDown' || event.key === 'ArrowUp')
    ) {
      event.preventDefault();
      const index = event.key === 'ArrowDown' ? 0 : items.length - 1;
      items[index].focus({ preventScroll: true });
    }
  };

  const handleItemPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    if (hit && event.currentTarget.contains(hit)) {
      focusElement(event.currentTarget, false);
    }
  };

  const closeFromItem = (fromPointer: boolean) => {
    const popover = popoverRef.current;
    const target = openedViaPointRef.current
      ? (restoreTargetRef.current ?? triggerRef.current)
      : triggerRef.current;
    if (popover && popover.matches(':popover-open')) {
      closeAndRestoreMenu(popover, target, fromPointer);
    }
  };

  return {
    triggerRef,
    popoverRef,
    groupRef,
    isOpen,
    handleTriggerPointerDown,
    handleTriggerClick,
    handleTriggerKeyDown,
    handlePopoverKeyDown,
    handleItemPointerMove,
    closeFromItem,
  };
}
