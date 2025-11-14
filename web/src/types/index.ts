// User related types
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  reminderTime: string; // HH:MM format
  language: string;
  timezone: string;
  defaultTime?: string; // HH:MM format, default medication time (defaults to 09:00 EST)
  snoozeDuration?: number; // Duration in minutes for snooze (defaults to 1 minute)
  defaultRefillTime?: string; // HH:MM format, default time for refill reminders (defaults to 09:00 EST)
  refillReminderDaysBefore?: number; // Number of days before refill date to show reminder (defaults to 1 day)
}

// Medication related types
export interface Medication {
  id: string;
  userId: string;
  name: string;
  genericName?: string;
  dosage: Dosage;
  frequency: Frequency;
  instructions?: string;
  startDate: Date;
  endDate?: Date;
  refillDate?: Date;
  isActive: boolean;
  sideEffects?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  reminders?: Reminder[];
  defaultTime?: string; // HH:MM format, default is 09:00 EST
  preferredTime?: string; // HH:MM format, preferred time for this medication
}

export interface Dosage {
  amount: number; // Strength amount per unit
  unit: DosageUnit; // Strength unit (mg, g, ml, etc.)
  form: DosageForm;
  quantity?: number; // How many units/pills to take
}

export interface Frequency {
  type: FrequencyType;
  timesPerDay?: number;
  daysOfWeek?: DayOfWeek[];
  interval?: number; // in hours
  specificTimes?: string[]; // HH:MM format
  timeOfDay?: string; // HH:MM format - primary time of day
}

export interface Reminder {
  id: string;
  time: string; // HH:MM format
  isEnabled: boolean;
  message?: string;
  soundEnabled: boolean;
}

// Enums
export type DosageUnit = 'mg' | 'g' | 'ml' | 'tablets' | 'capsules' | 'puffs' | 'units';
export type DosageForm = 'tablet' | 'capsule' | 'liquid' | 'injection' | 'inhaler' | 'patch' | 'cream';
export type FrequencyType = 'daily' | 'weekly' | 'as_needed' | 'custom';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types for creating/editing medications
export interface MedicationFormData {
  name: string;
  genericName?: string;
  dosageAmount: number; // Strength amount
  dosageUnit: DosageUnit; // Strength unit
  dosageForm: DosageForm;
  dosageQuantity?: number; // How many units to take
  frequencyType: FrequencyType;
  timesPerDay?: number;
  daysOfWeek?: DayOfWeek[];
  interval?: number;
  specificTimes?: string[];
  timeOfDay?: string; // HH:MM format
  instructions?: string;
  startDate: Date;
  endDate?: Date;
  refillDate?: Date;
  sideEffects?: string[];
  notes?: string;
  reminders?: Omit<Reminder, 'id'>[];
}

// Search and filter types
export interface MedicationFilters {
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  dosageForm?: DosageForm;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
  orderBy?: keyof Medication;
  orderDirection?: 'asc' | 'desc';
}
