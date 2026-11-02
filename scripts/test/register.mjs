// Loaded with `node --import ./scripts/test/register.mjs <test>` (run-all.mjs does this).
import { register } from 'node:module';

register('./ts-hooks.mjs', import.meta.url);
