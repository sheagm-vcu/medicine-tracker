import { MedicationModel } from '../models/Medication';
import { Button } from './Button';
import { Card } from './Card';

interface RefillNotificationPopoverProps {
  medication: MedicationModel;
  onDismiss: () => void;
  onSnooze?: (medicationId: string, durationSeconds: number) => void;
  onMedicationRefilled?: (medicationId: string) => void;
  snoozeDuration?: number; // Duration in minutes
  index?: number;
}

export function RefillNotificationPopover({ medication, onDismiss, onSnooze, onMedicationRefilled, snoozeDuration = 1, index = 0 }: RefillNotificationPopoverProps) {
  // Stack notifications: first at 16px (1rem) from bottom, then add 220px for each additional notification
  const bottomOffset = 16 + (index * 220); // 220px spacing between notifications (card height + gap)

  const handleSnooze = () => {
    if (onSnooze) {
      // Convert minutes to seconds for the callback
      onSnooze(medication.id, snoozeDuration * 60);
    }
    onDismiss();
  };

  const handleMedicationRefilled = () => {
    if (onMedicationRefilled) {
      onMedicationRefilled(medication.id);
    }
    onDismiss();
  };

  const refillDate = medication.refillDate ? new Date(medication.refillDate) : null;
  const daysUntilRefill = refillDate ? Math.ceil((refillDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div 
      className="fixed right-4 z-50 animate-slide-up"
      style={{ bottom: `${bottomOffset}px` }}
    >
      <Card className="max-w-sm w-full shadow-2xl border-2 border-orange-500">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-bold text-slate-900">Refill Reminder</h3>
            </div>
            <p className="text-xl font-semibold text-orange-600 mb-1">{medication.name}</p>
            {medication.genericName && (
              <p className="text-sm text-slate-600 italic mb-2">({medication.genericName})</p>
            )}
            {refillDate && (
              <p className="text-sm text-slate-700 mb-1">
                <span className="font-semibold">Refill Date:</span> {refillDate.toLocaleDateString()}
              </p>
            )}
            {daysUntilRefill !== null && (
              <p className="text-sm text-slate-700 mb-2">
                <span className="font-semibold">Days Until Refill:</span> {daysUntilRefill} day{daysUntilRefill !== 1 ? 's' : ''}
              </p>
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
          {onMedicationRefilled && (
            <Button 
              onClick={handleMedicationRefilled} 
              variant="primary"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Medication Refilled
            </Button>
          )}
          {onSnooze && (
            <Button 
              onClick={handleSnooze} 
              variant="secondary"
              className="flex-1"
            >
              Snooze
            </Button>
          )}
          {!onMedicationRefilled && (
            <Button onClick={onDismiss} className="flex-1">
              Dismiss
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

