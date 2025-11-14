import { useState, useEffect } from 'react';
import { UserModel } from '../models/User';
import { UserService } from '../services/UserService';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Container } from '../components/Container';
import { Input } from '../components/Input';

interface AccountSettingsProps {
  user: UserModel;
  onBack: () => void;
  onUserUpdate: (user: UserModel) => void;
}

export function AccountSettings({ user, onBack, onUserUpdate }: AccountSettingsProps) {
  const [defaultTime, setDefaultTime] = useState(user.preferences?.defaultTime || '09:00');
  const [snoozeDuration, setSnoozeDuration] = useState(user.preferences?.snoozeDuration || 1);
  const [refillReminderDaysBefore, setRefillReminderDaysBefore] = useState(user.preferences?.refillReminderDaysBefore || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setDefaultTime(user.preferences?.defaultTime || '09:00');
    setSnoozeDuration(user.preferences?.snoozeDuration || 1);
    setRefillReminderDaysBefore(user.preferences?.refillReminderDaysBefore || 1);
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(defaultTime)) {
        setError('Invalid time format. Please use HH:MM format (e.g., 09:00)');
        setLoading(false);
        return;
      }

      // Validate snooze duration
      if (snoozeDuration < 1 || snoozeDuration > 60) {
        setError('Snooze duration must be between 1 and 60 minutes');
        setLoading(false);
        return;
      }

      // Validate refill reminder days
      if (refillReminderDaysBefore < 0 || refillReminderDaysBefore > 30) {
        setError('Refill reminder days must be between 0 and 30 days');
        setLoading(false);
        return;
      }

      const updatedPreferences = {
        ...user.preferences,
        defaultTime,
        snoozeDuration,
        refillReminderDaysBefore,
      };

      await UserService.updateUserPreferences(user.uid, updatedPreferences);
      
      // Update local user model
      const updatedUser = new UserModel({
        ...user,
        preferences: updatedPreferences as typeof user.preferences,
      });
      onUserUpdate(updatedUser);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRevertToDefaults = () => {
    setDefaultTime('09:00');
    setSnoozeDuration(1);
    setRefillReminderDaysBefore(1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Container>
        <div className="py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Medicines
              </button>
              <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
            </div>

            <Card>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Settings</h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    Settings saved successfully!
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <Input
                      label="Default Medication Time"
                      type="time"
                      value={defaultTime}
                      onChange={(e) => setDefaultTime(e.target.value)}
                      helperText="This is the default time used for medications when a specific time is not provided. Format: HH:MM (24-hour format)"
                    />
                  </div>

                  <div>
                    <Input
                      label="Default Snooze Duration (minutes)"
                      type="number"
                      min="1"
                      max="60"
                      value={snoozeDuration.toString()}
                      onChange={(e) => setSnoozeDuration(parseInt(e.target.value) || 1)}
                      helperText="The duration in minutes that notifications will be snoozed when the snooze button is clicked. Range: 1-60 minutes"
                    />
                  </div>

                  <div>
                    <Input
                      label="Refill Reminder Days Before"
                      type="number"
                      min="0"
                      max="30"
                      value={refillReminderDaysBefore.toString()}
                      onChange={(e) => setRefillReminderDaysBefore(parseInt(e.target.value) || 1)}
                      helperText="Number of days before the refill date to show the reminder. Range: 0-30 days"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleSave}
                  loading={loading}
                  disabled={loading}
                  className="flex-1"
                >
                  Save Settings
                </Button>
                <Button
                  onClick={handleRevertToDefaults}
                  variant="outline"
                  disabled={loading}
                >
                  Revert to Defaults
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

