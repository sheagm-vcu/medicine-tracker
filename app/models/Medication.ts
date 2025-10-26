import { 
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
  public isActive: boolean;
  public sideEffects?: string[];
  public notes?: string;
  public createdAt: Date;
  public updatedAt: Date;
  public reminders?: Reminder[];

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
    this.isActive = data.isActive ?? true;
    this.sideEffects = data.sideEffects || [];
    this.notes = data.notes;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.reminders = data.reminders || [];
  }

  static fromFormData(formData: MedicationFormData, userId: string): MedicationModel {
    const frequency: Frequency = {
      type: formData.frequencyType,
      timesPerDay: formData.timesPerDay,
      daysOfWeek: formData.daysOfWeek,
      interval: formData.interval,
      specificTimes: formData.specificTimes,
    };

    const dosage: Dosage = {
      amount: formData.dosageAmount,
      unit: formData.dosageUnit,
      form: formData.dosageForm,
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
    };
    this.frequency = {
      type: formData.frequencyType,
      timesPerDay: formData.timesPerDay,
      daysOfWeek: formData.daysOfWeek,
      interval: formData.interval,
      specificTimes: formData.specificTimes,
    };
    this.instructions = formData.instructions;
    this.startDate = formData.startDate;
    this.endDate = formData.endDate;
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
    return `${this.dosage.amount} ${this.dosage.unit} ${this.dosage.form}`;
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
      isActive: this.isActive,
      sideEffects: this.sideEffects,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      reminders: this.reminders,
    };
  }

  static fromFirestoreData(data: any): MedicationModel {
    return new MedicationModel({
      id: data.id,
      userId: data.userId,
      name: data.name,
      genericName: data.genericName,
      dosage: data.dosage,
      frequency: data.frequency,
      instructions: data.instructions,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate(),
      isActive: data.isActive,
      sideEffects: data.sideEffects,
      notes: data.notes,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      reminders: data.reminders,
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
