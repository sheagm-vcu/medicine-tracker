import { useState, useEffect, useRef } from 'react';
import { UserModel } from './models/User';
import { MedicationModel } from './models/Medication';
import { AuthService } from './services/AuthService';
import { MedicationService } from './services/MedicationService';
import { UserService } from './services/UserService';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Container } from './components/Container';
import { MedicationDetailsForm } from './screens/MedicationDetailsForm';
import { AccountSettings } from './screens/AccountSettings';
import { NotificationPopover } from './components/NotificationPopover';
import { RefillNotificationPopover } from './components/RefillNotificationPopover';
import './style.css';

function App() {
  const [user, setUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<MedicationModel[]>([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationModel | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; medication: MedicationModel | null; fromNotification?: boolean }>({
    show: false,
    medication: null,
    fromNotification: false,
  });
  const [notifications, setNotifications] = useState<MedicationModel[]>([]);
  const [refillNotifications, setRefillNotifications] = useState<MedicationModel[]>([]);
  const notifiedTodayRef = useRef<Set<string>>(new Set());
  const refillNotifiedRef = useRef<Set<string>>(new Set()); // medicationId-date key for refill reminders
  const [currentView, setCurrentView] = useState<'main' | 'account'>('main');
  const snoozedNotificationsRef = useRef<Map<string, number>>(new Map()); // medicationId -> snoozeUntil timestamp
  const snoozedRefillNotificationsRef = useRef<Map<string, number>>(new Map()); // medicationId -> snoozeUntil timestamp
  const refillDateUpdateTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map()); // medicationId -> timeout
  const previousRefillDatesRef = useRef<Map<string, Date | null>>(new Map()); // medicationId -> previous refill date
  const previousUserDefaultTimeRef = useRef<string | undefined>(undefined); // Track previous user defaultTime

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (userModel) => {
      if (userModel) {
        // Load full user data from Firestore to get preferences
        try {
          const fullUser = await UserService.getUser(userModel.uid);
          if (fullUser) {
            setUser(fullUser);
          } else {
            // User doesn't exist in Firestore yet, create it
            await UserService.createOrUpdateUser(userModel);
            setUser(userModel);
          }
        } catch (error: any) {
          console.warn('Could not load user data:', error.message);
          setUser(userModel);
        }

        // Load user's medications (don't fail if index isn't created yet)
        try {
          await loadMedicines(userModel.uid);
        } catch (error: any) {
          console.warn('Could not load medications (index may need to be created):', error.message);
          // Set empty array - medications will load once index is created
          setMedicines([]);
        }
      } else {
        setUser(null);
        setMedicines([]);
        setNotifications([]);
        notifiedTodayRef.current.clear();
        snoozedNotificationsRef.current.clear();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check for medication notifications
  useEffect(() => {
    // Clear notification tracking for medications without explicit times when user's defaultTime changes
    const currentUserDefaultTime = user?.preferences?.defaultTime;
    if (previousUserDefaultTimeRef.current !== undefined && 
        previousUserDefaultTimeRef.current !== currentUserDefaultTime &&
        currentUserDefaultTime) {
      console.log(`[Notification] User defaultTime changed from ${previousUserDefaultTimeRef.current} to ${currentUserDefaultTime}. Clearing notification tracking for medications without explicit times.`);
      
      // Clear notification keys for medications that don't have explicit times
      const today = new Date().toDateString();
      medicines.forEach((medication) => {
        // Check if medication has explicit times (same logic as notification check)
        // Ignore default specificTimes ['09:00'] - treat as "not provided"
        const hasExplicitTime = medication.frequency?.timeOfDay || 
                                medication.preferredTime ||
                                (medication.frequency?.specificTimes && 
                                 Array.isArray(medication.frequency.specificTimes) && 
                                 medication.frequency.specificTimes.length > 0 &&
                                 !(medication.frequency.specificTimes.length === 1 && 
                                   medication.frequency.specificTimes[0] === '09:00' &&
                                   !medication.preferredTime && 
                                   !medication.frequency?.timeOfDay));
        
        if (!hasExplicitTime) {
          // Remove old notification keys for this medication
          const keysToRemove: string[] = [];
          notifiedTodayRef.current.forEach((key) => {
            if (key.startsWith(`${medication.id}-${today}-`)) {
              keysToRemove.push(key);
            }
          });
          keysToRemove.forEach(key => notifiedTodayRef.current.delete(key));
          console.log(`[Notification] Cleared ${keysToRemove.length} notification key(s) for ${medication.name} to allow re-notification at new default time`);
        }
      });
    }
    previousUserDefaultTimeRef.current = currentUserDefaultTime;

    // Reset notifications at midnight - re-enable all medications for the new day
    const resetNotifications = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      setTimeout(() => {
        console.log('[Notification Reset] Resetting for new day - all active medications can be notified again');
        notifiedTodayRef.current.clear();
        refillNotifiedRef.current.clear();
        snoozedNotificationsRef.current.clear();
        snoozedRefillNotificationsRef.current.clear();
        setNotifications([]);
        setRefillNotifications([]);
        
        // Schedule the next reset
        resetNotifications();
      }, msUntilMidnight);
    };

    resetNotifications();

    const checkMedicationTimes = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = now.toDateString();
      const currentTimestamp = now.getTime();

      console.log('[Notification Check]', {
        currentTime,
        currentTimestamp: new Date(currentTimestamp).toLocaleString(),
        totalMedications: medicines.length,
        activeMedications: medicines.filter(m => m.isActive).length,
      });

      const medicationsToNotify: MedicationModel[] = [];

      medicines.forEach((medication) => {
        if (!medication.isActive) {
          console.log(`[Notification Check] Skipping ${medication.name} - not active`);
          return;
        }

        // Check if this medication is currently snoozed
        const snoozeUntil = snoozedNotificationsRef.current.get(medication.id);
        if (snoozeUntil && currentTimestamp < snoozeUntil) {
          const snoozeRemaining = Math.ceil((snoozeUntil - currentTimestamp) / 1000);
          console.log(`[Notification Check] Skipping ${medication.name} - snoozed for ${snoozeRemaining} more seconds`);
          return; // Still snoozed
        }

        // Get all times for this medication from its frequency settings
        const timesToCheck: string[] = [];
        const userDefaultTime = user?.preferences?.defaultTime || '09:00';
        
        // Priority order: timeOfDay > specificTimes (if not default) > preferredTime > user defaultTime
        // First, check timeOfDay (highest priority for daily schedules)
        if (medication.frequency?.timeOfDay) {
          const timeOfDay = medication.frequency.timeOfDay;
          if (typeof timeOfDay === 'string' && timeOfDay.match(/^\d{2}:\d{2}$/)) {
            timesToCheck.push(timeOfDay);
          }
        }
        
        // If no timeOfDay, check frequency-specific times (for custom schedules)
        // BUT: ignore if it's just the default value ['09:00'] - treat as "not provided"
        if (timesToCheck.length === 0 && medication.frequency?.specificTimes && Array.isArray(medication.frequency.specificTimes) && medication.frequency.specificTimes.length > 0) {
          // Filter out any invalid times and add valid ones
          const validTimes = medication.frequency.specificTimes.filter(time => time && typeof time === 'string' && time.match(/^\d{2}:\d{2}$/));
          
          // Check if specificTimes is just the default value ['09:00'] - if so, ignore it
          const isJustDefault = validTimes.length === 1 && validTimes[0] === '09:00' && 
                                !medication.preferredTime && 
                                !medication.frequency?.timeOfDay;
          
          if (validTimes.length > 0 && !isJustDefault) {
            // User has explicitly set specificTimes (not just the default)
            timesToCheck.push(...validTimes);
          }
        }
        
        // If still no times found in frequency, check medication-level times
        if (timesToCheck.length === 0) {
          if (medication.preferredTime && typeof medication.preferredTime === 'string' && medication.preferredTime.match(/^\d{2}:\d{2}$/)) {
            // Medication has an explicit preferredTime - use it
            timesToCheck.push(medication.preferredTime);
          } else {
            // No explicit times provided - use user's global defaultTime
            // (Ignore medication.defaultTime and default specificTimes as they're just default values, not user-set)
            timesToCheck.push(userDefaultTime);
          }
        }
        console.log(`[Notification Check] Checking ${medication.name}:`, {
          frequencyType: medication.frequency.type,
          specificTimes: medication.frequency.specificTimes,
          timeOfDay: medication.frequency.timeOfDay,
          timesPerDay: medication.frequency.timesPerDay,
          preferredTime: medication.preferredTime,
          medicationDefaultTime: medication.defaultTime,
          userDefaultTime,
          timesToCheck,
          currentTime,
        });

        // Check each time for this medication
        for (const timeToCheck of timesToCheck) {
          const notificationKey = `${medication.id}-${today}-${timeToCheck}`;

          // Check if we've already notified for this medication today at this time
          if (notifiedTodayRef.current.has(notificationKey)) {
            console.log(`[Notification Check] Skipping ${medication.name} - already notified today at ${timeToCheck}`);
            continue;
          }

          // Check if current time matches the medication time
          if (timeToCheck === currentTime) {
            console.log(`[Notification Check] ✓ Triggering notification for ${medication.name} at ${timeToCheck}`);
            medicationsToNotify.push(medication);
            notifiedTodayRef.current.add(notificationKey);
            break; // Only notify once per medication, even if multiple times match
          }
        }
      });

      if (medicationsToNotify.length > 0) {
        console.log(`[Notification Check] Adding ${medicationsToNotify.length} notification(s):`, 
          medicationsToNotify.map(m => m.name));
        setNotifications((prev) => [...prev, ...medicationsToNotify]);
      } else {
        console.log('[Notification Check] No medications to notify at this time');
      }
    };

    // Check immediately
    checkMedicationTimes();

    // Check every 5 seconds
    const interval = setInterval(checkMedicationTimes, 5000);

    return () => clearInterval(interval);
  }, [medicines, user]);

  // Check for refill reminders - trigger 30 seconds after refill date is updated
  useEffect(() => {
    const daysBefore = user?.preferences?.refillReminderDaysBefore || 1;

    // Check for refill date changes and schedule reminders
    medicines.forEach((medication) => {
      if (!medication.isActive || !medication.refillDate) {
        // Clear any existing timeout if medication becomes inactive or loses refill date
        const existingTimeout = refillDateUpdateTimeoutsRef.current.get(medication.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          refillDateUpdateTimeoutsRef.current.delete(medication.id);
        }
        previousRefillDatesRef.current.set(medication.id, null);
        return;
      }

      const currentRefillDate = new Date(medication.refillDate);
      currentRefillDate.setHours(0, 0, 0, 0);
      const previousRefillDate = previousRefillDatesRef.current.get(medication.id);

      // Check if refill date has changed or is new
      const refillDateChanged = !previousRefillDate || 
        previousRefillDate.getTime() !== currentRefillDate.getTime();

      if (refillDateChanged) {
        console.log(`[Refill Reminder] Refill date updated for ${medication.name}:`, {
          previousRefillDate: previousRefillDate?.toDateString() || 'none',
          newRefillDate: currentRefillDate.toDateString(),
          daysBefore,
        });

        // Clear any existing timeout for this medication
        const existingTimeout = refillDateUpdateTimeoutsRef.current.get(medication.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Schedule reminder for 30 seconds from now (for demo purposes)
        const timeout = setTimeout(() => {
          // Recalculate dates when timeout fires
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const refillDate = new Date(medication.refillDate);
          refillDate.setHours(0, 0, 0, 0);
          
          const reminderDate = new Date(refillDate);
          reminderDate.setDate(reminderDate.getDate() - daysBefore);
          reminderDate.setHours(0, 0, 0, 0);

          const daysUntilRefill = Math.ceil((refillDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          console.log(`[Refill Reminder] 30 seconds elapsed after refill date update for ${medication.name}. Checking if reminder should show...`, {
            refillDate: refillDate.toDateString(),
            reminderDate: reminderDate.toDateString(),
            today: today.toDateString(),
            daysUntilRefill,
            daysBefore,
          });

          // Check if today is the reminder date or if refill is within the reminder window
          if (today.getTime() === reminderDate.getTime() || daysUntilRefill <= daysBefore) {
            const notificationKey = `${medication.id}-${today.toDateString()}`;
            
            // Check if we've already notified for this medication today
            if (!refillNotifiedRef.current.has(notificationKey)) {
              console.log(`[Refill Reminder] ✓ Triggering refill reminder for ${medication.name} (refill date: ${refillDate.toDateString()}, ${daysUntilRefill} day(s) away)`);
              setRefillNotifications((prev) => {
                // Only add if not already in notifications
                if (!prev.find(m => m.id === medication.id)) {
                  return [...prev, medication];
                }
                return prev;
              });
              refillNotifiedRef.current.add(notificationKey);
            } else {
              console.log(`[Refill Reminder] Skipping ${medication.name} - already notified today`);
            }
          } else {
            console.log(`[Refill Reminder] Not showing reminder for ${medication.name} yet. Reminder date: ${reminderDate.toDateString()}, Today: ${today.toDateString()}, Days until refill: ${daysUntilRefill}`);
          }

          refillDateUpdateTimeoutsRef.current.delete(medication.id);
        }, 30000); // 30 seconds

        refillDateUpdateTimeoutsRef.current.set(medication.id, timeout);
        previousRefillDatesRef.current.set(medication.id, currentRefillDate);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysUntilRefill = Math.ceil((currentRefillDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`[Refill Reminder] Scheduled reminder for ${medication.name} in 30 seconds (refill date: ${currentRefillDate.toDateString()}, ${daysUntilRefill} day(s) away)`);
      }
    });

    // Cleanup function
    return () => {
      refillDateUpdateTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      refillDateUpdateTimeoutsRef.current.clear();
    };
  }, [medicines, user]);

  const signIn = async () => {
    try {
      await AuthService.signInWithEmail('test@example.com', 'password123');
    } catch (error: any) {
      alert('Sign In Error: ' + error.message);
    }
  };

  const signUp = async () => {
    try {
      setIsCreatingUser(true);
      await AuthService.signUpWithEmail('test@example.com', 'password123');
    } catch (error: any) {
      alert('Sign Up Error: ' + error.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await AuthService.signInWithGoogle();
    } catch (error: any) {
      alert('Google Sign In Error: ' + error.message);
    }
  };

  const logout = async () => {
    try {
      await AuthService.signOut();
    } catch (error: any) {
      alert('Logout Error: ' + error.message);
    }
  };

  const handleMedicationSave = async () => {
    setShowMedicationForm(false);
    setEditingMedication(null);
    if (user) {
      await loadMedicines(user.uid);
    }
  };

  const handleEdit = (medicine: MedicationModel) => {
    setEditingMedication(medicine);
    setShowMedicationForm(true);
  };

  const handleDeleteClick = (medicine: MedicationModel) => {
    setDeleteConfirmation({ show: true, medication: medicine });
  };

  const handleDeactivate = async (medication: MedicationModel) => {
    try {
      await MedicationService.toggleMedicationStatus(medication.id);
      setDeleteConfirmation({ show: false, medication: null });
      if (user) {
        await loadMedicines(user.uid);
      }
    } catch (error: any) {
      alert('Error deactivating medication: ' + error.message);
    }
  };

  const handleDeletePermanently = async (medication: MedicationModel) => {
    if (window.confirm(`Are you sure you want to permanently delete "${medication.name}"? This action cannot be undone.`)) {
      try {
        await MedicationService.deleteMedication(medication.id);
        const wasFromNotification = deleteConfirmation.fromNotification;
        setDeleteConfirmation({ show: false, medication: null, fromNotification: false });
        if (user) {
          await loadMedicines(user.uid);
        }
        // If it was opened from notification and user deleted, don't re-show notification
      } catch (error: any) {
        alert('Error deleting medication: ' + error.message);
      }
    }
  };

  const loadMedicines = async (userId: string) => {
    try {
      const medications = await MedicationService.getMedicationsByUser(userId);
      // Sort: active medications first, then inactive (both by creation date)
      const sorted = [...medications].sort((a, b) => {
        if (a.isActive === b.isActive) {
          return b.createdAt.getTime() - a.createdAt.getTime(); // Newest first within same status
        }
        return a.isActive ? -1 : 1; // Active first
      });
      setMedicines(sorted);
    } catch (error: any) {
      // Don't show alert for index errors - they're expected until index is created
      if (error.message?.includes('index') || error.message?.includes('failed-precondition')) {
        console.warn('Medication index not yet created:', error.message);
        setMedicines([]);
      } else {
        alert('Error: ' + error.message);
      }
    }
  };

  const toggleMedicationStatus = async (medicationId: string) => {
    try {
      await MedicationService.toggleMedicationStatus(medicationId);
      if (user) {
        await loadMedicines(user.uid);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  // Show account settings view
  if (user && currentView === 'account') {
    return (
      <AccountSettings
        user={user}
        onBack={() => setCurrentView('main')}
        onUserUpdate={(updatedUser) => {
          setUser(updatedUser);
        }}
      />
    );
  }

  // Show medication form if user is logged in and form should be visible
  if (user && showMedicationForm) {
    return (
      <MedicationDetailsForm
        userId={user.uid}
        onSave={handleMedicationSave}
        onCancel={() => {
          setShowMedicationForm(false);
          setEditingMedication(null);
        }}
        initialData={editingMedication || undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Container>
        <div className="py-8">
          <h1 className="text-3xl font-bold mb-8 text-slate-900 text-center">Medicine Tracker</h1>
          
          {user ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 text-center">
                <div className="flex justify-between items-center mb-4">
                  <div></div>
                  <p className="text-lg text-slate-700">Welcome, {user.email}!</p>
                  <button
                    onClick={() => setCurrentView('account')}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Account Settings"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium">Account</span>
                  </button>
                </div>
                
                <div className="flex gap-4 justify-center mb-6">
                  <Button onClick={() => setShowMedicationForm(true)}>
                    Add a Medication
                  </Button>
                </div>
                
                <h2 className="text-xl font-bold mb-4 text-slate-900">
                  Medicines ({medicines.length})
                </h2>
              </div>

              <div className="space-y-4">
                {medicines.map((medicine, index) => (
                  <Card key={medicine.id || index} className="relative">
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{medicine.name}</h3>
                      {medicine.genericName && (
                        <p className="text-slate-600 italic mb-2">({medicine.genericName})</p>
                      )}
                      <p className="text-slate-700 mb-2">
                        {medicine.getDosageString()} - {medicine.getFrequencyString()}
                      </p>
                      {medicine.instructions && (
                        <p className="text-sm text-slate-600 italic mb-2">{medicine.instructions}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        medicine.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {medicine.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Edit and Delete icons at bottom right */}
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(medicine)}
                        className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                        title="Edit medication"
                        aria-label="Edit medication"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (!medicine.id || medicine.id.trim() === '') {
                            alert('Cannot delete medication: Invalid ID');
                            return;
                          }
                          handleDeleteClick(medicine);
                        }}
                        className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                        title="Delete medication"
                        aria-label="Delete medication"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </Card>
                ))}
                
                {medicines.length === 0 && (
                  <Card>
                    <p className="text-center text-slate-600">No medications yet. Add one to get started!</p>
                  </Card>
                )}
              </div>
              
              <div className="mt-8 text-center">
                <Button onClick={logout} variant="outline">
                  Logout
                </Button>
              </div>

              {/* Refill Reminder Notifications */}
              {refillNotifications.map((medication, index) => (
                <RefillNotificationPopover
                  key={`refill-notification-${medication.id}-${index}`}
                  medication={medication}
                  index={refillNotifications.length - 1 - index}
                  snoozeDuration={user?.preferences?.snoozeDuration || 1}
                  onDismiss={() => {
                    setRefillNotifications((prev) => prev.filter((m) => m.id !== medication.id));
                  }}
                  onSnooze={(medicationId, durationSeconds) => {
                    const med = medicines.find(m => m.id === medicationId);
                    if (!med || !med.refillDate) return;
                    
                    const snoozeDurationMinutes = durationSeconds / 60;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    // When snoozed, bump the reminder to tomorrow (next day)
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowKey = `${medicationId}-${tomorrow.toDateString()}`;
                    
                    // Remove today's notification key and add tomorrow's
                    const todayKey = `${medicationId}-${today.toDateString()}`;
                    refillNotifiedRef.current.delete(todayKey);
                    refillNotifiedRef.current.add(tomorrowKey);
                    
                    setRefillNotifications((prev) => prev.filter((m) => m.id !== medicationId));
                    
                    const refillDate = new Date(med.refillDate);
                    const daysUntilRefill = Math.ceil((refillDate.getTime() - tomorrow.getTime()) / (1000 * 60 * 60 * 24));
                    
                    console.log(`[Refill Reminder Snooze] ${med.name} snoozed. Reminder bumped to tomorrow (${tomorrow.toDateString()}). Refill date: ${refillDate.toDateString()} (${daysUntilRefill} day(s) away). Reminder will show again tomorrow at the reminder time.`);
                  }}
                  onMedicationRefilled={(medicationId) => {
                    // Mark as refilled - remove from notifications and prevent re-notification
                    const med = medicines.find(m => m.id === medicationId);
                    if (med) {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const notificationKey = `${medicationId}-${today.toDateString()}`;
                      refillNotifiedRef.current.add(notificationKey);
                      
                      // Also mark future dates to prevent showing again until refill date is updated
                      const refillDate = med.refillDate ? new Date(med.refillDate) : null;
                      if (refillDate) {
                        refillDate.setHours(0, 0, 0, 0);
                        // Mark all dates from today until refill date as notified
                        for (let d = new Date(today); d <= refillDate; d.setDate(d.getDate() + 1)) {
                          const futureKey = `${medicationId}-${d.toDateString()}`;
                          refillNotifiedRef.current.add(futureKey);
                        }
                      }
                      
                      console.log(`[Refill Reminder] Medication refilled: ${med.name}. Reminder will NOT show again until the refill date is updated.`);
                    }
                    setRefillNotifications((prev) => prev.filter((m) => m.id !== medicationId));
                  }}
                />
              ))}

              {/* Medication Notifications */}
              {notifications.map((medication, index) => (
                <NotificationPopover
                  key={`notification-${medication.id}-${index}`}
                  medication={medication}
                  index={notifications.length - 1 - index}
                  snoozeDuration={user?.preferences?.snoozeDuration || 1}
                  userDefaultTime={user?.preferences?.defaultTime || '09:00'}
                  onDismiss={() => {
                    setNotifications((prev) => prev.filter((m) => m.id !== medication.id));
                  }}
                  onSnooze={(medicationId, durationSeconds) => {
                    const med = medicines.find(m => m.id === medicationId);
                    const snoozeUntil = Date.now() + (durationSeconds * 1000);
                    const snoozeDurationMinutes = durationSeconds / 60;
                    
                    snoozedNotificationsRef.current.set(medicationId, snoozeUntil);
                    setNotifications((prev) => prev.filter((m) => m.id !== medicationId));
                    
                    console.log(`[Notification Snooze] ${med?.name || medicationId} snoozed for ${snoozeDurationMinutes} minute(s). Will remind again at ${new Date(snoozeUntil).toLocaleTimeString()}`);
                    
                    // Set a timeout to re-trigger the notification after snooze duration
                    setTimeout(() => {
                      snoozedNotificationsRef.current.delete(medicationId);
                      // Re-add the notification after snooze period
                      const med = medicines.find(m => m.id === medicationId);
                      if (med && med.isActive) {
                        setNotifications((prev) => {
                          // Only add if not already in notifications
                          if (!prev.find(m => m.id === medicationId)) {
                            return [...prev, med];
                          }
                          return prev;
                        });
                        console.log(`[Notification Snooze] Snooze period ended for ${med.name}. Notification re-triggered.`);
                      }
                    }, durationSeconds * 1000);
                  }}
                  onMedicineTaken={(medicationId) => {
                    // Mark as taken - remove from notifications and prevent re-notification for today
                    const med = medicines.find(m => m.id === medicationId);
                    if (med) {
                      const now = new Date();
                      const today = now.toDateString();
                      // Get all times for this medication (same priority as notification check)
                      const timesToMark: string[] = [];
                      
                      // Priority order: timeOfDay > specificTimes (if not default) > preferredTime > user defaultTime
                      // (Ignore medication.defaultTime and default specificTimes as they're just default values, not user-set)
                      if (med.frequency?.timeOfDay) {
                        timesToMark.push(med.frequency.timeOfDay);
                      } else if (med.frequency?.specificTimes && Array.isArray(med.frequency.specificTimes) && med.frequency.specificTimes.length > 0) {
                        // Filter valid times
                        const validTimes = med.frequency.specificTimes.filter(time => time && typeof time === 'string' && time.match(/^\d{2}:\d{2}$/));
                        
                        // Check if specificTimes is just the default value ['09:00'] - if so, ignore it
                        const isJustDefault = validTimes.length === 1 && validTimes[0] === '09:00' && 
                                              !med.preferredTime && 
                                              !med.frequency?.timeOfDay;
                        
                        if (validTimes.length > 0 && !isJustDefault) {
                          // User has explicitly set specificTimes (not just the default)
                          timesToMark.push(...validTimes);
                        } else {
                          // Use user's global defaultTime
                          timesToMark.push(user?.preferences?.defaultTime || '09:00');
                        }
                      } else if (med.preferredTime) {
                        timesToMark.push(med.preferredTime);
                      } else {
                        // Use user's global defaultTime
                        timesToMark.push(user?.preferences?.defaultTime || '09:00');
                      }
                      
                      // Mark all times for this medication as taken today
                      timesToMark.forEach(timeToCheck => {
                        const notificationKey = `${medicationId}-${today}-${timeToCheck}`;
                        notifiedTodayRef.current.add(notificationKey);
                      });
                      
                      console.log(`[Notification] Medicine taken: ${med.name} - marked as taken for today at times: ${timesToMark.join(', ')}`);
                    }
                    // Remove from active notifications
                    setNotifications((prev) => prev.filter((m) => m.id !== medicationId));
                  }}
                  onChangeSnoozeDuration={() => {
                    setCurrentView('account');
                  }}
                  onNoLongerTaking={(medication) => {
                    setDeleteConfirmation({ show: true, medication, fromNotification: true });
                  }}
                />
              ))}

              {/* Delete Confirmation Popover */}
              {deleteConfirmation.show && deleteConfirmation.medication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <Card className="max-w-md w-full mx-4">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Medication</h3>
                      <p className="text-slate-700 mb-4">
                        What would you like to do with "{deleteConfirmation.medication.name}"?
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Button
                        onClick={() => handleDeactivate(deleteConfirmation.medication!)}
                        variant="secondary"
                        className="w-full"
                      >
                        Deactivate
                      </Button>
                      <p className="text-xs text-slate-500 text-center">
                        Medication will be saved but marked as inactive and moved to the bottom of the list
                      </p>
                      
                      <div className="border-t border-slate-200 pt-3">
                        <Button
                          onClick={() => handleDeletePermanently(deleteConfirmation.medication!)}
                          variant="primary"
                          className="w-full bg-red-600 hover:bg-red-700"
                        >
                          Delete Permanently
                        </Button>
                        <p className="text-xs text-red-600 text-center mt-2">
                          This action cannot be undone
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => {
                          const wasFromNotification = deleteConfirmation.fromNotification;
                          const medicationToRestore = deleteConfirmation.medication;
                          setDeleteConfirmation({ show: false, medication: null, fromNotification: false });
                          
                          // If opened from notification, restore the notification
                          if (wasFromNotification && medicationToRestore) {
                            setNotifications((prev) => {
                              // Only add if not already in notifications
                              if (!prev.find(m => m.id === medicationToRestore.id)) {
                                return [...prev, medicationToRestore];
                              }
                              return prev;
                            });
                          }
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <Card>
                <div className="text-center">
                  <p className="text-lg text-slate-700 mb-6">Please sign in to continue</p>
                  
                  <div className="space-y-4">
                    <Button 
                      onClick={signUp}
                      disabled={isCreatingUser}
                      loading={isCreatingUser}
                      className="w-full"
                    >
                      {isCreatingUser ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                    
                    <Button 
                      onClick={signIn}
                      variant="secondary"
                      className="w-full"
                    >
                      Sign In
                    </Button>
                    
                    <Button 
                      onClick={signInWithGoogle}
                      variant="outline"
                      className="w-full"
                    >
                      Sign In with Google
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

export default App;
