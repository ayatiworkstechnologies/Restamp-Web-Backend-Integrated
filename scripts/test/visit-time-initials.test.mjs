// Visit times are read as UTC (src/lib/datetime.ts) and every user avatar
// uses one initials rule (src/lib/initials.ts).
import { readFileSync } from 'node:fs';
import { check, done } from './check.mjs';
import { parseApiDate } from '@/lib/datetime';
import { getInitials } from '@/lib/initials';

const src = (p) => readFileSync(new URL(`../../src/${p}`, import.meta.url), 'utf8');

// --- UTC parsing ---------------------------------------------------------------
const naive = parseApiDate('2026-11-06T05:00:00');
check('zone-less backend time is UTC (05:00Z = 10:30 IST)', naive?.toISOString() === '2026-11-06T05:00:00.000Z', naive);
check('fractional seconds too', parseApiDate('2026-11-06T05:00:00.250')?.toISOString() === '2026-11-06T05:00:00.250Z');
check('explicit Z is not shifted twice', parseApiDate('2026-11-06T05:00:00Z')?.toISOString() === '2026-11-06T05:00:00.000Z');
check('explicit offset is kept', parseApiDate('2026-11-06T10:30:00+05:30')?.toISOString() === '2026-11-06T05:00:00.000Z');
check('missing or invalid -> null', [null, undefined, '', 'not a date'].every((v) => parseApiDate(v) === null));
const activity = src('app/activity/page.tsx');
check('Activity formats times through parseApiDate', activity.includes('parseApiDate(iso)') && !activity.includes('new Date(iso)'));
check(
  'visit request confirmation formats through parseApiDate',
  src('components/property/DealerEnquirySection.tsx').includes('parseApiDate(visit.scheduled_at)')
);

// --- initials ------------------------------------------------------------------
check('first + last -> two letters', getInitials('Roshan S') === 'RS');
check('single name -> one letter', getInitials('Roshan') === 'R');
check('middle names skipped', getInitials('Roshan Kumar Shah') === 'RS');
check('extra whitespace ignored', getInitials('  roshan    s ') === 'RS');
check('missing / empty / whitespace -> empty', [undefined, null, '', '   '].every((v) => getInitials(v) === ''));
check('phone-number names never become initials', getInitials('+919876543210') === '');
check('placeholders are not names', ['User', 'Owner', 'Guest', 'Restamp user', 'User Profile'].every((v) => getInitials(v) === ''));
const sites = ['app/activity/page.tsx', 'app/owner/dashboard/layout.tsx', 'app/owner/dashboard/profile/page.tsx', 'components/layout/Header.tsx'];
const adHoc = sites.filter((f) => /\.charAt\(0\)\.toUpperCase\(\)/.test(src(f)));
check('no ad-hoc first-letter avatars remain', adHoc.length === 0, adHoc);
check('every user avatar uses getInitials', sites.every((f) => src(f).includes('getInitials(')));

done();
