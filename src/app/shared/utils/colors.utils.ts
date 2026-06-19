import { Colors, ObjColors } from '@shared/models/colors.model';

// ponytail: minimalist-ui pastel palette — all values use desaturated,
// muted colors matching the warm monochrome + pastel accent scheme.
// Board key names (sky/yellow/green/red/etc.) preserved for backwards
// compatibility with persisted API data.

export const COLORS: ObjColors = {
    sky: {
      'bg-primary-200': true,
      'hover:bg-primary-300': true,
      'text-gray-900': true,
    },
    yellow: {
      'bg-warning-100': true,
      'hover:bg-warning-200': true,
      'text-warning-800': true,
    },
    green: {
      'bg-success-200': true,
      'hover:bg-success-300': true,
      'text-success-800': true,
    },
    red: {
      'bg-danger-200': true,
      'hover:bg-danger-300': true,
      'text-danger-800': true,
    },
    violet: {
      'bg-primary-200': true,
      'hover:bg-primary-300': true,
      'text-gray-900': true,
    },
    gray: {
      'bg-gray-200': true,
      'hover:bg-gray-300': true,
      'text-gray-900': true,
    },
    success: {
      'bg-success-200': true,
      'hover:bg-success-300': true,
      'focus:ring-success-300': true,
      'text-success-800': true,
    },
    primary: {
      'bg-primary-200': true,
      'hover:bg-primary-300': true,
      'focus:ring-primary-300': true,
      'text-gray-900': true,
    },
    danger: {
      'bg-danger-200': true,
      'hover:bg-danger-300': true,
      'focus:ring-danger-300': true,
      'text-danger-800': true,
    },
    light: {
      'bg-gray-100': true,
      'hover:bg-gray-300': true,
      'focus:ring-gray-50': true,
      'text-gray-700': true,
    },
    info: {
      'bg-info-200': true,
      'hover:bg-info-300': true,
      'focus:ring-info-300': true,
      'text-gray-900': true,
    },
}

// ponytail: pastel backgrounds for board detail page — light, airy, no bright colors
export const BACKGROUNDS : ObjColors = {
    sky:       { 'bg-primary-200': true },
    yellow:    { 'bg-warning-100': true },
    green:     { 'bg-success-200': true },
    red:       { 'bg-danger-200': true },
    violet:    { 'bg-primary-100': true },
    gray:      { 'bg-gray-200': true },
    success:   { 'bg-success-200': true },
    primary:   { 'bg-primary-200': true },
    danger:    { 'bg-danger-200': true },
    light:     { 'bg-gray-100': true },
    info:      { 'bg-info-200': true },
}

// ponytail: navbar uses warm dark for all board colors — subtle, not distracting
export const NAVBAR_BACKGROUNDS : ObjColors = {
    sky:       { 'bg-gray-800': true },
    yellow:    { 'bg-gray-800': true },
    green:     { 'bg-gray-800': true },
    red:       { 'bg-gray-800': true },
    violet:    { 'bg-gray-800': true },
    gray:      { 'bg-gray-800': true },
    success:   { 'bg-gray-800': true },
    primary:   { 'bg-gray-800': true },
    danger:    { 'bg-gray-800': true },
    light:     { 'bg-gray-800': true },
    info:      { 'bg-gray-800': true },
}
