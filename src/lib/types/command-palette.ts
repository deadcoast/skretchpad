export type PaletteMode = 'commands' | 'files' | 'symbols';

export interface PaletteFileItem {
  path: string;
  name: string;
  relativePath: string;
}

export interface PaletteSymbolItem {
  name: string;
  kind: string;
  line: number;
}

export type PaletteExecuteDetail =
  | { type: 'command'; commandId: string }
  | { type: 'file'; path: string }
  | { type: 'symbol'; line: number };
