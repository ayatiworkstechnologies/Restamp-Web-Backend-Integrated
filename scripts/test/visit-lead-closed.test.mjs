// A visit request or change refused because the owner closed the buyer's
// enquiry (422 "Lead is closed") is explained plainly, never shown raw.
import { check, done } from './check.mjs';
import { ApiError } from '@/lib/api/client';
import { visitErrorMessage } from '@/lib/api/buyer';

const closed = new ApiError('validation', 422, 'Request failed', 'Lead is closed');
check('change refused on a closed enquiry says the visit was cancelled',
  /closed your enquiry/.test(visitErrorMessage(closed, 'x')) && /cancelled/.test(visitErrorMessage(closed, 'x')));
check('new request on a closed enquiry points to a new enquiry',
  /Send a new enquiry/.test(visitErrorMessage(closed, 'x', 'request')));
check('other 422s keep the server wording',
  visitErrorMessage(new ApiError('validation', 422, 'Request failed', 'Cannot move visit from CANCELLED to CONFIRMED'), 'x')
    === 'Cannot move visit from CANCELLED to CONFIRMED');
check('non-API errors use the fallback', visitErrorMessage(new Error('boom'), 'fallback') === 'fallback');

done();
