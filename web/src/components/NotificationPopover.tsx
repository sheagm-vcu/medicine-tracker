import { MedicationModel } from '../models/Medication';
import { Button } from './Button';
import { Card } from './Card';

interface NotificationPopoverProps {
  medication: MedicationModel;
  onDismiss: () => void;
  onSnooze?: (medicationId: string, durationSeconds: number) => void;
  onMedicineTaken?: (medicationId: string) => void;
  onChangeSnoozeDuration?: () => void;
  onNoLongerTaking?: (medication: MedicationModel) => void;
  snoozeDuration?: number; // Duration in minutes
  userDefaultTime?: string; // User's global default time
  index?: number;
}

export function NotificationPopover({ medication, onDismiss, onSnooze, onMedicineTaken, onChangeSnoozeDuration, onNoLongerTaking, snoozeDuration = 1, userDefaultTime = '09:00', index = 0 }: NotificationPopoverProps) {
  // Get the time to display - same logic as notification check (priority: timeOfDay > specificTimes (if not default) > preferredTime > user defaultTime)
  // (Ignore medication.defaultTime and default specificTimes as they're just default values, not user-set)
  let timeToTake: string;
  if (medication.frequency?.timeOfDay) {
    timeToTake = medication.frequency.timeOfDay;
  } else if (medication.frequency?.specificTimes && Array.isArray(medication.frequency.specificTimes) && medication.frequency.specificTimes.length > 0) {
    // Check if specificTimes is just the default value ['09:00'] - if so, ignore it
    const validTimes = medication.frequency.specificTimes.filter(time => time && typeof time === 'string' && time.match(/^\d{2}:\d{2}$/));
    const isJustDefault = validTimes.length === 1 && validTimes[0] === '09:00' && 
                          !medication.preferredTime && 
                          !medication.frequency?.timeOfDay;
    
    if (validTimes.length > 0 && !isJustDefault) {
      // User has explicitly set specificTimes (not just the default)
      timeToTake = validTimes[0]; // Show first time
    } else {
      // Use user's global defaultTime
      timeToTake = userDefaultTime;
    }
  } else if (medication.preferredTime) {
    timeToTake = medication.preferredTime;
  } else {
    // Use user's global defaultTime
    timeToTake = userDefaultTime;
  }
  // Stack notifications: first at 16px (1rem) from bottom, then add 220px for each additional notification
  const bottomOffset = 16 + (index * 220); // 220px spacing between notifications (card height + gap)

  const handleSnooze = () => {
    if (onSnooze) {
      // Convert minutes to seconds for the callback
      onSnooze(medication.id, snoozeDuration * 60);
    }
    onDismiss();
  };

  const handleMedicineTaken = () => {
    if (onMedicineTaken) {
      onMedicineTaken(medication.id);
    }
    onDismiss();
  };

  return (
    <div 
      className="fixed right-4 z-50 animate-slide-up"
      style={{ bottom: `${bottomOffset}px` }}
    >
      <Card className="max-w-sm w-full shadow-2xl border-2 border-blue-500">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-bold text-slate-900">Time to Take Medication</h3>
            </div>
            <p className="text-xl font-semibold text-blue-600 mb-1">{medication.name}</p>
            {medication.genericName && (
              <p className="text-sm text-slate-600 italic mb-2">({medication.genericName})</p>
            )}
            <p className="text-sm text-slate-700 mb-1">
              <span className="font-semibold">Dosage:</span> {medication.getDosageString()}
            </p>
            <p className="text-sm text-slate-700 mb-2">
              <span className="font-semibold">Time:</span> {timeToTake}
            </p>
            {medication.instructions && (
              <p className="text-xs text-slate-600 italic mt-2">{medication.instructions}</p>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="ml-4 p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Dismiss notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex gap-2">
          {onMedicineTaken && (
            <Button 
              onClick={handleMedicineTaken} 
              variant="primary"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Medicine Taken
            </Button>
          )}
          {onSnooze && (
            <Button 
              onClick={handleSnooze} 
              variant="secondary"
              className="flex-1"
            >
              Snooze ({snoozeDuration} min{snoozeDuration !== 1 ? 's' : ''})
            </Button>
          )}
          {!onMedicineTaken && (
            <Button onClick={onDismiss} className="flex-1">
              Dismiss
            </Button>
          )}
        </div>
        
        {/* Action Links - Below buttons */}
        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
          {onChangeSnoozeDuration && (
            <button
              onClick={() => {
                onChangeSnoozeDuration();
                onDismiss();
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors"
            >
              Change Snooze Duration
            </button>
          )}
          {onNoLongerTaking && (
            <button
              onClick={() => {
                onNoLongerTaking(medication);
                onDismiss();
              }}
              className="w-full text-xs py-2 px-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
            >
              I'm no longer taking this medication
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

