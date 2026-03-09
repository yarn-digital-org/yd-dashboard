'use client';

import { useState } from 'react';
import { Shield, Key, Smartphone, Loader2, Check, AlertCircle, Eye, EyeOff, Monitor, Globe, Copy, RefreshCw, X } from 'lucide-react';

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const backupCodes = [
    'ABCD-1234-EFGH', 'IJKL-5678-MNOP', 'QRST-9012-UVWX',
    'YZAB-3456-CDEF', 'GHIJ-7890-KLMN', 'OPQR-1234-STUV',
    'WXYZ-5678-ABCD', 'EFGH-9012-IJKL',
  ];

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Password updated successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update password' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update password' });
    } finally {
      setSaving(false);
    }
  };

  const handleVerify2FA = () => {
    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      setVerifyError('Enter a valid 6-digit code');
      return;
    }
    setVerifyError('');
    setSetupStep('backup');
  };

  const handleComplete2FA = () => {
    setTwoFAEnabled(true);
    setShowSetup(false);
    setSetupStep('qr');
    setVerificationCode('');
  };

  const handleDisable2FA = () => {
    setTwoFAEnabled(false);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
  };

  const activeSessions = [
    { device: 'Chrome on macOS', ip: '192.168.1.100', location: 'Melbourne, AU', current: true, lastActive: 'Now' },
    { device: 'Safari on iPhone', ip: '203.45.67.89', location: 'Melbourne, AU', current: false, lastActive: '2 hours ago' },
    { device: 'Firefox on Windows', ip: '10.0.0.42', location: 'Sydney, AU', current: false, lastActive: '3 days ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
              <p className="text-sm text-gray-500">Manage your password and account security</p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
          </div>

          {message && (
            <div className={`flex items-center gap-2 p-4 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              {message.text}
            </div>
          )}

          <div className="space-y-4 max-w-md">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input type={showCurrentPassword ? 'text' : 'password'} id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10" placeholder="Enter current password" />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input type={showNewPassword ? 'text' : 'password'} id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10" placeholder="Enter new password" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Confirm new password" />
            </div>

            <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${twoFAEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Smartphone className={`h-5 w-5 ${twoFAEnabled ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
            </div>
            {twoFAEnabled ? (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full font-medium">Enabled</span>
                <button onClick={handleDisable2FA} className="text-sm text-red-600 hover:text-red-700 font-medium">Disable</button>
              </div>
            ) : (
              <button onClick={() => { setShowSetup(true); setSetupStep('qr'); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Enable 2FA
              </button>
            )}
          </div>

          {/* 2FA Setup Flow */}
          {showSetup && !twoFAEnabled && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              {/* Step indicators */}
              <div className="flex items-center gap-2 mb-6">
                {['Scan QR Code', 'Verify', 'Backup Codes'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      (i === 0 && setupStep === 'qr') || (i === 1 && setupStep === 'verify') || (i === 2 && setupStep === 'backup')
                        ? 'bg-blue-600 text-white'
                        : i < ['qr', 'verify', 'backup'].indexOf(setupStep)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>{i + 1}</div>
                    <span className="text-xs text-gray-600 hidden sm:inline">{step}</span>
                    {i < 2 && <div className="w-8 h-px bg-gray-300" />}
                  </div>
                ))}
                <button onClick={() => setShowSetup(false)} className="ml-auto text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {setupStep === 'qr' && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                  <div className="flex justify-center mb-4">
                    <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                      {/* Placeholder QR code pattern */}
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 49 }).map((_, i) => (
                          <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.5 ? 'bg-gray-900' : 'bg-white'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <p className="text-xs text-gray-500 mb-1">Or enter this code manually:</p>
                    <code className="px-3 py-1 bg-gray-100 rounded text-sm font-mono tracking-wider">JBSW-Y3DP-EHPK-3PXP</code>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => setSetupStep('verify')} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                      Next: Verify Code
                    </button>
                  </div>
                </div>
              )}

              {setupStep === 'verify' && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">Enter the 6-digit code from your authenticator app to verify setup.</p>
                  <div className="max-w-xs">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError(''); }}
                      className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="000000"
                      maxLength={6}
                    />
                    {verifyError && <p className="mt-2 text-sm text-red-600">{verifyError}</p>}
                  </div>
                  <div className="flex justify-between mt-4">
                    <button onClick={() => setSetupStep('qr')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Back</button>
                    <button onClick={handleVerify2FA} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Verify & Continue</button>
                  </div>
                </div>
              )}

              {setupStep === 'backup' && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <p className="text-sm font-medium text-gray-900">Save your backup codes</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Store these codes in a safe place. Each code can only be used once if you lose access to your authenticator.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 p-4 bg-white rounded-lg border border-gray-200">
                    {backupCodes.map((code) => (
                      <code key={code} className="text-sm font-mono text-gray-700 py-1">{code}</code>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <button onClick={copyBackupCodes} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg">
                      <Copy className="h-4 w-4" /> Copy Codes
                    </button>
                    <button onClick={handleComplete2FA} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium">
                      I&apos;ve Saved My Codes — Enable 2FA
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Active Sessions</h3>
            <button className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium">
              <RefreshCw className="h-3.5 w-3.5" /> Revoke All Others
            </button>
          </div>
          <div className="space-y-3">
            {activeSessions.map((session, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {session.device}
                      {session.current && <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Current</span>}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Globe className="h-3 w-3" />
                      <span>{session.ip} · {session.location} · {session.lastActive}</span>
                    </div>
                  </div>
                </div>
                {!session.current && (
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium">Revoke</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
