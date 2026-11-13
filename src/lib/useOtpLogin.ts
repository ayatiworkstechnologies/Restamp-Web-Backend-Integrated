import { useRef, useState } from 'react';
import { requestOtp, toE164India, verifyOtp } from '@/lib/api/auth';
import { isApiError } from '@/lib/api/client';
import type { Session } from '@/lib/api/session';

export const OTP_LENGTH = 6;

/** Login-screen message for an OTP API failure (static backend details only). */
function otpErrorMessage(e: unknown, stage: 'request' | 'verify'): string {
  if (isApiError(e)) {
    if (e.status === 429) return e.detail || 'Too many attempts. Please wait a while and try again.';
    if (e.status === 503) return 'OTP sign-in is not available right now. Please try again later.';
    if (stage === 'verify' && e.kind === 'login') return 'Incorrect or expired code. Please try again.';
    if (e.kind === 'validation') return 'Enter a valid 10-digit Indian mobile number.';
    if (e.kind === 'offline') return 'Could not reach the Restamp server. Check your connection and try again.';
    if (e.kind === 'timeout') return 'The server took too long to respond. Please try again.';
  }
  return stage === 'request' ? 'Could not send the code. Please try again.' : 'Could not verify the code. Please try again.';
}

/**
 * Mobile + OTP sign-in against the backend (POST /auth/otp/request and
 * /auth/otp/verify). The code is shown on screen ONLY when the backend
 * itself returned it (its fixed testing OTP, local/staging); otherwise the
 * user must receive it by SMS. No code is ever invented or checked
 * client-side.
 */
export function useOtpLogin() {
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const phone = toE164India(mobile);

  const sendCode = async (): Promise<boolean> => {
    if (!phone) {
      setError('Enter a valid 10-digit mobile number');
      return false;
    }
    setBusy(true);
    setError('');
    try {
      const res = await requestOtp(phone);
      setDebugCode(res.debugCode);
      setOtp(Array(OTP_LENGTH).fill(''));
      setStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
      return true;
    } catch (e) {
      setError(otpErrorMessage(e, 'request'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (): Promise<Session | null> => {
    const code = otp.join('');
    if (!phone || code.length < OTP_LENGTH) return null;
    setBusy(true);
    setError('');
    try {
      return await verifyOtp(phone, code);
    } catch (e) {
      setError(otpErrorMessage(e, 'verify'));
      setOtp(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
      return null;
    } finally {
      setBusy(false);
    }
  };

  const changeOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const otpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const pasteOtp = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digits) return;
    e.preventDefault();
    setOtp(Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] ?? ''));
    otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  const backToMobile = () => {
    setStep('mobile');
    setError('');
    setDebugCode(null);
  };

  return {
    step,
    mobile,
    setMobile,
    otp,
    error,
    setError,
    busy,
    debugCode,
    otpRefs,
    sendCode,
    verifyCode,
    changeOtp,
    otpKeyDown,
    pasteOtp,
    backToMobile,
  };
}
