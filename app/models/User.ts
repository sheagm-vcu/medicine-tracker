import { User as FirebaseUser } from 'firebase/auth';
import { User, UserPreferences } from '../types';

export class UserModel {
  public uid: string;
  public email: string;
  public displayName?: string;
  public photoURL?: string;
  public createdAt: Date;
  public lastLoginAt?: Date;
  public preferences?: UserPreferences;

  constructor(data: Partial<User> = {}) {
    this.uid = data.uid || '';
    this.email = data.email || '';
    this.displayName = data.displayName;
    this.photoURL = data.photoURL;
    this.createdAt = data.createdAt || new Date();
    this.lastLoginAt = data.lastLoginAt;
    this.preferences = data.preferences || this.getDefaultPreferences();
  }

  static fromFirebaseUser(firebaseUser: FirebaseUser): UserModel {
    return new UserModel({
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      lastLoginAt: new Date(),
    });
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'auto',
      notifications: true,
      reminderTime: '09:00',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
  }

  updateLastLogin(): void {
    this.lastLoginAt = new Date();
  }

  toFirestoreData(): Record<string, any> {
    return {
      uid: this.uid,
      email: this.email,
      displayName: this.displayName,
      photoURL: this.photoURL,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
      preferences: this.preferences,
    };
  }

  static fromFirestoreData(data: any): UserModel {
    return new UserModel({
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastLoginAt: data.lastLoginAt?.toDate(),
      preferences: data.preferences,
    });
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.uid) errors.push('User ID is required');
    if (!this.email) errors.push('Email is required');
    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
