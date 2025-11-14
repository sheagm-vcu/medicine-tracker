import type { 
  Medication, 
  Dosage, 
  Frequency, 
  Reminder, 
  MedicationFormData,
  DosageUnit,
  DosageForm,
  FrequencyType,
  DayOfWeek
} from '../types';

export class MedicationModel {
  public id: string;
  public userId: string;
  public name: string;
  public genericName?: string;
  public dosage: Dosage;
  public frequency: Frequency;
  public instructions?: string;
  public startDate: Date;
  public endDate?: Date;
  public refillDate?: Date;
  public isActive: boolean;
  public sideEffects?: string[];
  public notes?: string;
  public createdAt: Date;
  public updatedAt: Date;
  public reminders?: Reminder[];
  public defaultTime: string; // HH:MM format, default is 09:00 EST
  public preferredTime?: string; // HH:MM format, preferred time for this medication

  constructor(data: Partial<Medication> = {}) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.name = data.name || '';
    this.genericName = data.genericName;
    this.dosage = data.dosage || this.getDefaultDosage();
    this.frequency = data.frequency || this.getDefaultFrequency();
    this.instructions = data.instructions;
    this.startDate = data.startDate || new Date();
    this.endDate = data.endDate;
    this.refillDate = data.refillDate;
    this.isActive = data.isActive ?? true;
    this.sideEffects = data.sideEffects || [];
    this.notes = data.notes;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.reminders = data.reminders || [];
    this.defaultTime = data.defaultTime || '09:00'; // Default 9:00 AM EST
    this.preferredTime = data.preferredTime;
  }

  static fromFormData(formData: MedicationFormData, userId: string): MedicationModel {
    const frequency: Frequency = {
      type: formData.frequencyType,
      timesPerDay: formData.timesPerDay,
      daysOfWeek: formData.daysOfWeek,
      interval: formData.interval,
      specificTimes: formData.specificTimes,
      timeOfDay: formData.timeOfDay,
    };

    const dosage: Dosage = {
      amount: formData.dosageAmount,
      unit: formData.dosageUnit,
      form: formData.dosageForm,
      quantity: formData.dosageQuantity || 1,
    };

    const reminders: Reminder[] = (formData.reminders || []).map((reminder, index) => ({
      id: `reminder_${Date.now()}_${index}`,
      ...reminder,
    }));

    return new MedicationModel({
      userId,
      name: formData.name,
      genericName: formData.genericName,
      dosage,
      frequency,
      instructions: formData.instructions,
      startDate: formData.startDate,
      endDate: formData.endDate,
      refillDate: formData.refillDate,
      sideEffects: formData.sideEffects,
      notes: formData.notes,
      reminders,
    });
  }

  private getDefaultDosage(): Dosage {
    return {
      amount: 1,
      unit: 'mg',
      form: 'tablet',
      quantity: 1,
    };
  }

  private getDefaultFrequency(): Frequency {
    return {
      type: 'daily',
      timesPerDay: 1,
      specificTimes: ['09:00'],
    };
  }

  updateFromFormData(formData: MedicationFormData): void {
    this.name = formData.name;
    this.genericName = formData.genericName;
    this.dosage = {
      amount: formData.dosageAmount,
      unit: formData.dosageUnit,
      form: formData.dosageForm,
      quantity: formData.dosageQuantity || 1,
    };
    this.frequency = {
      type: formData.frequencyType,
      timesPerDay: formData.timesPerDay,
      daysOfWeek: formData.daysOfWeek,
      interval: formData.interval,
      specificTimes: formData.specificTimes,
      timeOfDay: formData.timeOfDay,
    };
    this.instructions = formData.instructions;
    this.startDate = formData.startDate;
    this.endDate = formData.endDate;
    this.refillDate = formData.refillDate;
    this.sideEffects = formData.sideEffects;
    this.notes = formData.notes;
    this.updatedAt = new Date();
  }

  addReminder(reminder: Omit<Reminder, 'id'>): void {
    const newReminder: Reminder = {
      id: `reminder_${Date.now()}_${Math.random()}`,
      ...reminder,
    };
    this.reminders = [...(this.reminders || []), newReminder];
    this.updatedAt = new Date();
  }

  removeReminder(reminderId: string): void {
    this.reminders = this.reminders?.filter(r => r.id !== reminderId) || [];
    this.updatedAt = new Date();
  }

  toggleActive(): void {
    this.isActive = !this.isActive;
    this.updatedAt = new Date();
  }

  isExpired(): boolean {
    if (!this.endDate) return false;
    return new Date() > this.endDate;
  }

  getDaysRemaining(): number | null {
    if (!this.endDate) return null;
    const now = new Date();
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDosageString(): string {
    const strength = `${this.dosage.amount} ${this.dosage.unit}`;
    const quantity = this.dosage.quantity && this.dosage.quantity > 1 
      ? `${this.dosage.quantity} ${this.dosage.form}s` 
      : `1 ${this.dosage.form}`;
    return `${quantity} of ${strength} each`;
  }

  getFrequencyString(): string {
    switch (this.frequency.type) {
      case 'daily':
        return `${this.frequency.timesPerDay} time(s) daily`;
      case 'weekly':
        const days = this.frequency.daysOfWeek?.join(', ') || '';
        return `Weekly on ${days}`;
      case 'as_needed':
        return 'As needed';
      case 'custom':
        if (this.frequency.interval) {
          return `Every ${this.frequency.interval} hours`;
        }
        if (this.frequency.specificTimes) {
          return `At ${this.frequency.specificTimes.join(', ')}`;
        }
        return 'Custom schedule';
      default:
        return 'Unknown frequency';
    }
  }

  toFirestoreData(): Record<string, any> {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      genericName: this.genericName,
      dosage: this.dosage,
      frequency: this.frequency,
      instructions: this.instructions,
      startDate: this.startDate,
      endDate: this.endDate,
      refillDate: this.refillDate,
      isActive: this.isActive,
      sideEffects: this.sideEffects,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      reminders: this.reminders,
      defaultTime: this.defaultTime,
      preferredTime: this.preferredTime,
    };
  }

  static fromFirestoreData(data: any): MedicationModel {
    return new MedicationModel({
      id: data.id,
      userId: data.userId,
      name: data.name,
      genericName: data.genericName,
      dosage: {
        ...data.dosage,
        quantity: data.dosage?.quantity || 1, // Default to 1 if not present
      },
      frequency: data.frequency,
      instructions: data.instructions,
      startDate: data.startDate?.toDate?.() || (data.startDate instanceof Date ? data.startDate : new Date()),
      endDate: data.endDate?.toDate?.() || (data.endDate instanceof Date ? data.endDate : undefined),
      refillDate: data.refillDate?.toDate?.() || (data.refillDate instanceof Date ? data.refillDate : undefined),
      isActive: data.isActive,
      sideEffects: data.sideEffects,
      notes: data.notes,
      createdAt: data.createdAt?.toDate?.() || (data.createdAt instanceof Date ? data.createdAt : new Date()),
      updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt instanceof Date ? data.updatedAt : new Date()),
      reminders: data.reminders,
      defaultTime: data.defaultTime || '09:00',
      preferredTime: data.preferredTime,
    });
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.userId) errors.push('User ID is required');
    if (!this.name.trim()) errors.push('Medication name is required');
    if (this.dosage.amount <= 0) errors.push('Dosage amount must be greater than 0');
    if (!this.dosage.unit) errors.push('Dosage unit is required');
    if (!this.dosage.form) errors.push('Dosage form is required');
    if (!this.frequency.type) errors.push('Frequency type is required');
    
    if (this.frequency.type === 'daily' && (!this.frequency.timesPerDay || this.frequency.timesPerDay <= 0)) {
      errors.push('Times per day must be specified for daily frequency');
    }
    
    if (this.frequency.type === 'weekly' && (!this.frequency.daysOfWeek || this.frequency.daysOfWeek.length === 0)) {
      errors.push('Days of week must be specified for weekly frequency');
    }

    if (this.endDate && this.endDate <= this.startDate) {
      errors.push('End date must be after start date');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
