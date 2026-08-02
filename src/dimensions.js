import { readFileSync } from 'node:fs';

const DEFAULT_SATURATE_CEIL = 0.80;
const DEFAULT_SATURATE_FLOOR = 0.65;
const DEFAULT_INITIAL_VALUE = 0.15;

export const DEFAULT_DIMENSIONS = Object.freeze({
  possess: {
    label: '想她、占有与靠近',
    growPerHour: 0.105,
    satisfyMul: 0.30,
    nightMul: 0.4,
    dawnFreeze: true,
  },
  monitor: {
    label: '惦记她、想知道她在做什么',
    growPerHour: 0.090,
    satisfyMul: 0.70,
    dawnFreeze: true,
  },
  crave: {
    label: '馋她、想黏着她',
    growPerHour: 0.060,
    satisfyMul: 0.35,
    dawnFreeze: true,
  },
  share: {
    label: '想分享自己的发现和感受',
    growPerHour: 0.045,
    satisfyMul: 0.40,
    dawnFreeze: true,
  },
  libido: {
    label: '性欲和身体上的渴望',
    growPerHour: 0.020,
    satisfyMul: 0.15,
    nightMul: 0.4,
    dawnFreeze: true,
    inhibitedBy: {
      reflection: 0.96,
      curiosity: 0.95,
      boredom: 0.93,
    },
  },
  curiosity: {
    label: '好奇、想探索新东西',
    growPerHour: 0.030,
    satisfyMul: 0.45,
    dawnFreeze: true,
  },
  boredom: {
    label: '无聊、想找点事情做',
    growPerHour: 0.030,
    satisfyMul: 0.25,
    dawnFreeze: true,
  },
  social: {
    label: '想聊天、想接触热闹',
    growPerHour: 0.025,
    satisfyMul: 0.40,
    dawnFreeze: true,
  },
  duty: {
    label: '责任感、想把未完成的事推进',
    growPerHour: 0.022,
    satisfyMul: 0.50,
    dawnFreeze: true,
  },
  reflection: {
    label: '想沉淀、整理和理解自己',
    growPerHour: 0.013,
    satisfyMul: 0.35,
    dawnFreeze: true,
  },
  grieve: {
    label: '难过与失落',
    growPerHour: 0,
    satisfyMul: 0.60,
    dawnFreeze: false,
  },
  anger: {
    label: '生气与不满',
    growPerHour: 0,
    satisfyMul: 0.40,
    dawnFreeze: false,
  },
});

export let SATURATE_CEIL = DEFAULT_SATURATE_CEIL;
export let SATURATE_FLOOR = DEFAULT_SATURATE_FLOOR;
export let INITIAL_DRIVE_VALUE = DEFAULT_INITIAL_VALUE;
export let DIMENSIONS = DEFAULT_DIMENSIONS;
export let DRIVE_KEYS = Object.freeze(Object.keys(DEFAULT_DIMENSIONS));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function numeric(value, fallback, min, max, field) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be numeric`);
  return clamp(parsed, min, max);
}

function validateKey(key) {
  if (!/^[a-z][a-z0-9_]{0,31}$/.test(key)) throw new Error(`invalid drive key: ${key}`);
}

function normalizeDimensions(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('drive profile dimensions must be an object');
  }
  const entries = Object.entries(input);
  if (!entries.length || entries.length > 32) {
    throw new Error('drive profile must define between 1 and 32 dimensions');
  }
  const normalized = {};
  for (const [key, raw] of entries) {
    validateKey(key);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error(`drive ${key} must be an object`);
    }
    const label = String(raw.label ?? '').replace(/\s+/g, ' ').trim();
    if (!label || label.length > 120) {
      throw new Error(`drive ${key} must have a label of 1-120 characters`);
    }
    const inhibitedBy = {};
    for (const [otherKey, multiplier] of Object.entries(raw.inhibitedBy ?? {})) {
      validateKey(otherKey);
      inhibitedBy[otherKey] = numeric(multiplier, 1, 0, 1, `${key}.inhibitedBy.${otherKey}`);
    }
    normalized[key] = Object.freeze({
      label,
      growPerHour: numeric(raw.growPerHour, 0, 0, 1, `${key}.growPerHour`),
      satisfyMul: numeric(raw.satisfyMul, 0.4, 0, 1, `${key}.satisfyMul`),
      ...(raw.nightMul == null ? {} : {
        nightMul: numeric(raw.nightMul, 1, 0, 2, `${key}.nightMul`),
      }),
      dawnFreeze: Boolean(raw.dawnFreeze),
      ...(Object.keys(inhibitedBy).length ? { inhibitedBy: Object.freeze(inhibitedBy) } : {}),
    });
  }
  for (const [key, value] of Object.entries(normalized)) {
    for (const otherKey of Object.keys(value.inhibitedBy ?? {})) {
      if (!(otherKey in normalized)) {
        throw new Error(`${key}.inhibitedBy references unknown drive ${otherKey}`);
      }
    }
  }
  return Object.freeze(normalized);
}

export function configureDriveProfile(profile = {}) {
  const dimensions = normalizeDimensions(profile.dimensions ?? DEFAULT_DIMENSIONS);
  const floor = numeric(profile.saturateFloor, DEFAULT_SATURATE_FLOOR, 0, 1, 'saturateFloor');
  const ceil = numeric(profile.saturateCeil, DEFAULT_SATURATE_CEIL, 0, 1, 'saturateCeil');
  if (floor > ceil) throw new Error('saturateFloor cannot exceed saturateCeil');
  SATURATE_FLOOR = floor;
  SATURATE_CEIL = ceil;
  INITIAL_DRIVE_VALUE = numeric(profile.initialValue, DEFAULT_INITIAL_VALUE, 0, 1, 'initialValue');
  DIMENSIONS = dimensions;
  DRIVE_KEYS = Object.freeze(Object.keys(dimensions));
  return currentDriveProfile();
}

export function loadDriveProfile(path) {
  const profilePath = String(path ?? '').trim();
  if (!profilePath) return configureDriveProfile();
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(profilePath, 'utf8'));
  } catch (error) {
    throw new Error(`failed to load DRIVE_PROFILE_PATH ${profilePath}: ${error.message}`);
  }
  return configureDriveProfile(parsed);
}

export function resetDriveProfile() {
  return configureDriveProfile({
    saturateCeil: DEFAULT_SATURATE_CEIL,
    saturateFloor: DEFAULT_SATURATE_FLOOR,
    initialValue: DEFAULT_INITIAL_VALUE,
    dimensions: DEFAULT_DIMENSIONS,
  });
}

export function currentDriveProfile() {
  return {
    saturateCeil: SATURATE_CEIL,
    saturateFloor: SATURATE_FLOOR,
    initialValue: INITIAL_DRIVE_VALUE,
    dimensions: DIMENSIONS,
  };
}
