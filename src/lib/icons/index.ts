// src/lib/icons/index.ts
// Inline SVG icon system for Skretchpad
// Design: geometric, minimal, 1.5px stroke, currentColor for theming

export const icons = {
  pin: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2.5L13.5 6.5L10.5 9.5L11 13L8 10L3 15"/><path d="M9.5 2.5L6.5 5.5L2 5L5 8L2.5 10.5"/><line x1="6.5" y1="5.5" x2="10.5" y2="9.5"/></svg>',

  eye: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8C2 8 4.5 3.5 8 3.5C11.5 3.5 14 8 14 8C14 8 11.5 12.5 8 12.5C4.5 12.5 2 8 2 8Z"/><circle cx="8" cy="8" r="2"/></svg>',

  eyeOff:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3L13 13"/><path d="M9.6 9.6A2 2 0 0 1 6.4 6.4"/><path d="M5 5.2C3.5 6.2 2 8 2 8C2 8 4.5 12.5 8 12.5C9 12.5 9.9 12.2 10.7 11.7"/><path d="M8 3.5C11.5 3.5 14 8 14 8C14 8 13.3 9.2 12 10.4"/></svg>',

  minimize:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="4" y1="8" x2="12" y2="8"/></svg>',

  maximize:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="10" height="10" rx="1.5"/></svg>',

  restore:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4.5" width="8.5" height="8.5" rx="1.5"/><path d="M5.5 4.5V3.5C5.5 2.67 6.17 2 7 2H12.5C13.33 2 14 2.67 14 3.5V9C14 9.83 13.33 10.5 12.5 10.5H11"/></svg>',

  close:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>',

  file: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2H4.5C3.67 2 3 2.67 3 3.5V12.5C3 13.33 3.67 14 4.5 14H11.5C12.33 14 13 13.33 13 12.5V6L9 2Z"/><polyline points="9 2 9 6 13 6"/></svg>',

  plugin:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2V4"/><path d="M10 2V4"/><rect x="2" y="4" width="12" height="10" rx="1.5"/><path d="M6 9V11"/><path d="M10 9V11"/><path d="M5 9H7"/><path d="M9 9H11"/></svg>',

  shield:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2L3 4.5V7.5C3 10.8 5.2 13.8 8 14.5C10.8 13.8 13 10.8 13 7.5V4.5L8 2Z"/></svg>',

  checkmark:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3.5 8 6.5 11 12.5 5"/></svg>',

  xmark:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>',

  warning:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7.13 2.5L1.5 12.5C1.19 13.04 1.58 13.75 2.2 13.75H13.8C14.42 13.75 14.81 13.04 14.5 12.5L8.87 2.5C8.56 1.96 7.44 1.96 7.13 2.5Z"/><line x1="8" y1="6" x2="8" y2="9"/><circle cx="8" cy="11.5" r="0.5" fill="currentColor" stroke="none"/></svg>',

  info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><line x1="8" y1="7" x2="8" y2="11"/><circle cx="8" cy="5" r="0.5" fill="currentColor" stroke="none"/></svg>',

  settings:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2"/><path d="M13.3 10.1L12.5 9.3A4.8 4.8 0 0 0 12.5 6.7L13.3 5.9A6.5 6.5 0 0 0 12 3.5L10.8 3.8A4.8 4.8 0 0 0 8.7 2.6L8.5 1.5A6.5 6.5 0 0 0 7.5 1.5L7.3 2.6A4.8 4.8 0 0 0 5.2 3.8L4 3.5A6.5 6.5 0 0 0 2.7 5.9L3.5 6.7A4.8 4.8 0 0 0 3.5 9.3L2.7 10.1A6.5 6.5 0 0 0 4 12.5L5.2 12.2A4.8 4.8 0 0 0 7.3 13.4L7.5 14.5A6.5 6.5 0 0 0 8.5 14.5L8.7 13.4A4.8 4.8 0 0 0 10.8 12.2L12 12.5A6.5 6.5 0 0 0 13.3 10.1Z"/></svg>',

  chevronDown:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 6 8 10 12 6"/></svg>',

  sidebar:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="1.5"/><line x1="6" y1="2" x2="6" y2="14"/></svg>',

  diff: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="1.5"/><line x1="8" y1="2" x2="8" y2="14"/><line x1="4" y1="6" x2="6.5" y2="6"/><line x1="5.25" y1="4.75" x2="5.25" y2="7.25"/><line x1="9.5" y1="10" x2="12" y2="10"/></svg>',

  gitBranch:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="4" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="6" r="1.5"/><line x1="5" y1="5.5" x2="5" y2="10.5"/><path d="M5 6.5C5 6.5 5 8 7 8C9 8 11 7.5 11 7.5"/></svg>',

  sync: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6C3.2 3.7 5.4 2 8 2C11.3 2 14 4.7 14 8"/><polyline points="12 6 14 8 16 6"/><path d="M13.5 10C12.8 12.3 10.6 14 8 14C4.7 14 2 11.3 2 8"/><polyline points="4 10 2 8 0 10"/></svg>',

  plus: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>',

  minus:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="3" y1="8" x2="13" y2="8"/></svg>',

  discard:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7C3 7 5 3 8 3C11 3 13 6 13 8C13 10 11 13 8 13C5.5 13 4 11.5 3.5 10"/><polyline points="3 3 3 7 7 7"/></svg>',

  chevronUp:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 10 8 6 12 10"/></svg>',

  folder:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4.5C2 3.67 2.67 3 3.5 3H6.5L8 5H12.5C13.33 5 14 5.67 14 6.5V11.5C14 12.33 13.33 13 12.5 13H3.5C2.67 13 2 12.33 2 11.5V4.5Z"/></svg>',

  columns:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="1.5"/><line x1="8" y1="2" x2="8" y2="14"/></svg>',

  rows: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="1.5"/><line x1="2" y1="8" x2="14" y2="8"/></svg>',
} as const;

export type IconName = keyof typeof icons;
