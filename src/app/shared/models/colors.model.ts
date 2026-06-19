// Domain type. CSS class maps (COLORS, BACKGROUNDS, NAVBAR_BACKGROUNDS)
// are presentation concerns and live in @shared/utils/colors.utils.
export type Colors =
  | 'sky'
  | 'yellow'
  | 'green'
  | 'red'
  | 'violet'
  | 'gray'
  | 'success'
  | 'primary'
  | 'danger'
  | 'light'
  | 'info';

export type ObjColors = Record<Colors, Record<string, boolean>>;
