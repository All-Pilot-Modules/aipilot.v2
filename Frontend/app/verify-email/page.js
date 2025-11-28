'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resending, setResending] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(false);

  // Auto-verify if token is present in URL (magic link)
  useEffect(() => {
    if (token) {
      verifyWithToken(token);
    }
  }, [token]);

  const verifyWithToken = async (verificationToken) => {
    setVerifyingToken(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email/token?token=${verificationToken}`
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
      } else {
        setError(data.detail || 'Verification failed. Please try entering the code manually.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setVerifyingToken(false);
    }
  };

  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newCode.every(digit => digit !== '') && index === 5) {
      handleVerifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Check if it's a 6-digit code
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);

      // Focus last input
      const lastInput = document.getElementById('code-5');
      if (lastInput) lastInput.focus();

      // Auto-submit
      handleVerifyCode(pastedData);
    }
  };

  const handleVerifyCode = async (codeString) => {
    if (!email) {
      setError('Email address is missing. Please register again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email/code?email=${encodeURIComponent(email)}&code=${codeString}`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
      } else {
        setError(data.detail || 'Invalid verification code');
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Email address is missing. Please register again.');
      return;
    }

    setResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email/resend?email=${encodeURIComponent(email)}`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess('Verification email sent! Please check your inbox.');
      } else {
        setError(data.detail || 'Failed to resend email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (verifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Verify Your Email</h1>
          <p className="text-gray-600">
            We sent a verification code to
          </p>
          <p className="font-semibold text-indigo-600">{email || 'your email'}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
            {success}
          </div>
        )}

        {!success && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Enter 6-digit code
              </label>
              <div className="flex gap-2 justify-center">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => handleVerifyCode(code.join(''))}
              disabled={loading || code.some(d => !d)}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed mb-4"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Didn't receive the code?
              </p>
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm disabled:text-gray-400"
              >
                {resending ? 'Sending...' : 'Resend Email'}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Wrong email?{' '}
                <a href="/sign-up" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  Register again
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
