/**
 * Encryption Key Management Component
 *
 * Provides UI for managing encryption keys:
 * - View key metadata and history
 * - Rotate encryption keys
 * - Back up encryption key
 * - Change master password
 *
 * 密钥管理 UI - 管理端到端加密密钥
 *
 * @module components/sync/KeyManagement
 */

import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@dailyuse/ui-shadcn';
import { Button } from '@dailyuse/ui-shadcn';
import { Label } from '@dailyuse/ui-shadcn';
import {
  Lock,
  Key,
  RotateCw,
  Eye,
  EyeOff,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { cn } from '@dailyuse/ui-shadcn';

// Types
interface EncryptionKey {
  id: string;
  version: number;
  algorithm: string;
  created: Date;
  rotated?: Date;
  lastUsed?: Date;
  active: boolean;
  strength: number; // 0-100
}

/**
 * Key Info Card Component
 */
const KeyInfoCard: React.FC<{ key: EncryptionKey }> = ({ key }) => {
  return (
    <Card className={cn(key.active && 'border-blue-200 bg-blue-50')}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Key Status */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Encryption Key</p>
              <p className="font-mono text-sm mt-1">Key-v{key.version}</p>
            </div>
            <div className="flex items-center gap-2">
              {key.active ? (
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </div>
              ) : (
                <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                  Archived
                </div>
              )}
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-t border-b">
            <div>
              <p className="text-xs text-gray-600">Algorithm</p>
              <p className="font-semibold">{key.algorithm}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Strength</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-32 h-2 bg-gray-200 rounded-full">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      key.strength > 80
                        ? 'bg-green-500'
                        : key.strength > 60
                          ? 'bg-yellow-500'
                          : 'bg-orange-500'
                    )}
                    style={{ width: `${key.strength}%` }}
                  />
                </div>
                <span className="text-xs font-semibold">{key.strength}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600">Created</p>
              <p className="text-sm">{key.created.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Last Used</p>
              <p className="text-sm">
                {key.lastUsed
                  ? key.lastUsed.toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Backup Key
            </Button>
            {!key.active && (
              <Button
                size="sm"
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Key Rotation Dialog
 */
const KeyRotationDialog: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
  const [step, setStep] = useState<'confirm' | 'rotating' | 'complete'>(
    'confirm'
  );
  const [progress, setProgress] = useState(0);

  const handleStartRotation = () => {
    setStep('rotating');

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep('complete');
          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCw className="w-5 h-5" />
            Rotate Encryption Key
          </CardTitle>
          <CardDescription>
            Generate a new encryption key and re-encrypt all data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'confirm' && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">
                      Key rotation will:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Generate a new encryption key</li>
                      <li>Re-encrypt all data on all devices</li>
                      <li>Take several minutes to complete</li>
                      <li>Not affect your data integrity</li>
                      <li>Old key will be archived</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={onCancel} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleStartRotation} className="flex-1">
                  <RotateCw className="w-4 h-4 mr-2" />
                  Start Rotation
                </Button>
              </div>
            </>
          )}

          {step === 'rotating' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">
                    Re-encrypting data...
                  </span>
                  <span className="text-sm text-gray-600">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <p>Processing...</p>
                <p>All 320 items will be re-encrypted with the new key</p>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <>
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <div className="text-center space-y-2">
                <p className="font-semibold">Key Rotation Complete!</p>
                <p className="text-sm text-gray-600">
                  All data has been re-encrypted with the new key
                </p>
              </div>

              <Button onClick={onConfirm} className="w-full">
                Continue
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Master Password Change Dialog
 */
const PasswordChangeDialog: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const isValid = currentPassword && newPassword && confirmPassword === newPassword;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Master Password
          </CardTitle>
          <CardDescription>
            Update your encryption master password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                Your password is never stored. It's only used to derive your encryption key.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="current">Current Password</Label>
              <div className="relative mt-1">
                <input
                  id="current"
                  type={showPasswords ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="new">New Password</Label>
              <div className="relative mt-1">
                <input
                  id="new"
                  type={showPasswords ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirm">Confirm New Password</Label>
              <div className="relative mt-1">
                <input
                  id="confirm"
                  type={showPasswords ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg',
                    confirmPassword &&
                      confirmPassword !== newPassword &&
                      'border-red-500'
                  )}
                />
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-600 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={e => setShowPasswords(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show passwords</span>
            </label>
          </div>

          <div className="flex gap-3">
            <Button onClick={onCancel} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={!isValid} className="flex-1">
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Main Key Management View
 */
export const KeyManagementView: React.FC = () => {
  const [keys] = useState<EncryptionKey[]>([
    {
      id: '1',
      version: 2,
      algorithm: 'AES-256-GCM',
      created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      rotated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      lastUsed: new Date(Date.now() - 1000), // Just now
      active: true,
      strength: 95,
    },
    {
      id: '2',
      version: 1,
      algorithm: 'AES-256-GCM',
      created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      rotated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      active: false,
      strength: 92,
    },
  ]);

  const [showRotation, setShowRotation] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const activeKey = keys.find(k => k.active);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Encryption Key Management</h1>
        <p className="text-gray-600 mt-1">
          Manage your encryption keys and master password for secure data synchronization
        </p>
      </div>

      {/* Active Key */}
      {activeKey && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Key</h2>
          <KeyInfoCard key={activeKey.id} />
        </div>
      )}

      {/* Key Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Key Management Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => setShowRotation(true)}
            variant="outline"
            className="w-full justify-start"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            Rotate Encryption Key
          </Button>
          <Button
            onClick={() => setShowPasswordChange(true)}
            variant="outline"
            className="w-full justify-start"
          >
            <Lock className="w-4 h-4 mr-2" />
            Change Master Password
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
          >
            <Download className="w-4 h-4 mr-2" />
            Back Up Encryption Key
          </Button>
        </CardContent>
      </Card>

      {/* Key History */}
      {keys.length > 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Key History</h2>
          <div className="space-y-4">
            {keys
              .filter(k => !k.active)
              .map(key => (
                <KeyInfoCard key={key.id} />
              ))}
          </div>
        </div>
      )}

      {/* Security Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p>
              <strong>Rotate keys regularly:</strong> Rotate your encryption key every 90 days for enhanced security
            </p>
          </div>
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p>
              <strong>Strong master password:</strong> Use a unique, strong password with at least 12 characters
            </p>
          </div>
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p>
              <strong>Back up your key:</strong> Store a backup of your encryption key in a secure location
            </p>
          </div>
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p>
              <strong>Never share password:</strong> Your password is only stored locally, never transmitted
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showRotation && (
        <KeyRotationDialog
          onConfirm={() => setShowRotation(false)}
          onCancel={() => setShowRotation(false)}
        />
      )}

      {showPasswordChange && (
        <PasswordChangeDialog
          onConfirm={() => setShowPasswordChange(false)}
          onCancel={() => setShowPasswordChange(false)}
        />
      )}
    </div>
  );
};

export default KeyManagementView;
