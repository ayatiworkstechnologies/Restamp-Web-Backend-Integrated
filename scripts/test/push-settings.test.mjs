import { readFileSync } from 'node:fs';
import { check, done } from './check.mjs';
import {
  PUSH_PREFERENCE_ITEMS,
  PUSH_UNAVAILABLE_NOTE,
  activeDeviceCount,
  pushDevicesLine,
  pushErrorMessage,
  pushFailureLabel,
  toPushStatus,
} from '@/lib/pushSettings';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

// --- status mapping + honest text (the backend stays authoritative)
const s = toPushStatus({
  available: true,
  devices: [{ id: 3, platform: 'ios', status: 'ACTIVE', invalid_reason: null, token_prefix: 'ExponentPushToken[a1b2…9z8]' }],
  preferences: { enquiries: true, visits: false, listings: true },
});
check('status mapping keeps availability, devices (masked prefix only) and preferences',
  s.available && s.devices.length === 1 && s.devices[0].id === 3 && s.devices[0].status === 'ACTIVE' &&
  s.devices[0].tokenPrefix === 'ExponentPushToken[a1b2…9z8]' && s.preferences.visits === false, s);
check('empty response -> safe dormant state', toPushStatus(null).available === false &&
  toPushStatus(null).devices.length === 0 && toPushStatus(null).preferences.enquiries === true);
check('devices default to INACTIVE and platforms stay in the backend set',
  toPushStatus({ devices: [null] }).devices[0].status === 'INACTIVE' &&
  toPushStatus({ devices: [{ platform: 'web' }] }).devices[0].platform === 'ios');
check('active-device count reads the mapped rows',
  activeDeviceCount(s) === 1 && activeDeviceCount(toPushStatus({ devices: [{ status: 'INVALID' }] })) === 0 &&
  activeDeviceCount(null) === 0);
check('device line is honest about how many devices receive alerts',
  pushDevicesLine(s) === '1 device will receive these alerts' &&
  pushDevicesLine({ ...s, devices: [...s.devices, { ...s.devices[0], id: 4 }] }) === '2 devices will receive these alerts' &&
  pushDevicesLine(null) === null);
check('the two preference rows map each label to exactly ONE backend key',
  PUSH_PREFERENCE_ITEMS.length === 2 &&
  PUSH_PREFERENCE_ITEMS[0].key === 'enquiries' && PUSH_PREFERENCE_ITEMS[0].label === 'Lead Alerts' &&
  PUSH_PREFERENCE_ITEMS[1].key === 'visits' && PUSH_PREFERENCE_ITEMS[1].label === 'Visit Reminders');
check('the dormant note is the fixed copy', PUSH_UNAVAILABLE_NOTE === 'Push alerts are not available yet.');
const m = (status, kind, action) => pushErrorMessage({ status, kind }, action);
check('error messages by meaning',
  m(0, 'offline', 'prefs').startsWith("Couldn't reach") && m(429, 'retry', 'prefs').startsWith('Too many requests') &&
  m(401, 'login', 'load').startsWith('Your session has expired') && m(403, 'denied', 'prefs').startsWith("Your account can't") &&
  m(500, 'retry', 'load') === "Couldn't load your notification settings." && m(500, 'retry', 'prefs') === 'Something went wrong. Please try again.');
check('admin failure kinds get readable labels',
  pushFailureLabel('recipient') === 'Device no longer registered' &&
  pushFailureLabel('superseded') === 'Outdated (visit moved, lead answered or closed)' &&
  pushFailureLabel('no_device') === 'No active device' && pushFailureLabel(null) === '—' &&
  pushFailureLabel('new_kind') === 'new_kind');

// --- wiring
const card = read('src/components/settings/PushSettingsCard.tsx');
check('ONE shared card on the buyer, owner and agent profile pages',
  ['src/app/profile/page.tsx', 'src/app/owner/dashboard/profile/page.tsx', 'src/app/agent/dashboard/profile/page.tsx']
    .every((p) => read(p).includes("import PushSettingsCard from '@/components/settings/PushSettingsCard';") && read(p).includes('<PushSettingsCard')));
check('card applies only server-confirmed state', card.includes('aria-checked={on}') && card.includes('savePushPreferences(next)') && card.includes('const on = !!status?.preferences[item.key]'));
check('a failed save reverts the optimistic switch', card.includes('setStatus(base)'));
check('card drops another account\'s responses', card.includes('accountEpoch.current !== epoch') && card.includes('}, [userId]);'));
check('switches are off while dormant or while the backend has no push provider', card.includes('const disabled = !status || !status.available || !!busy'));
check('honest states: loading, load error + retry, dormant note', card.includes('Loading notification settings') && card.includes('Try again') && card.includes('PUSH_UNAVAILABLE_NOTE'));
const api = read('src/lib/api/push.ts');
check('API calls act on the signed-in account only (no user id path)', !/\/users\/\$\{/.test(api) && api.includes("'/users/me/push'"));
check('the website never registers a device and never handles a raw token',
  !card.includes('registerPushDevice') && !card.includes('deactivatePushDevice') &&
  !/RESEND|EXPO_ACCESS_TOKEN|expo-push|4923b31d/.test([card, api, read('src/lib/pushSettings.ts')].join('')));
check('push preferences are independent of email preferences (separate endpoint)',
  api.includes("'/users/me/push/preferences'") && !api.includes('/users/me/email'));
