import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { UserModel } from '../models/User';
import type { UserPreferences } from '../types';

export class UserService {
  private static readonly COLLECTION_NAME = 'users';

  static async createUser(user: UserModel): Promise<void> {
    try {
      const validation = user.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      await setDoc(doc(db, this.COLLECTION_NAME, user.uid), {
        ...user.toFirestoreData(),
        createdAt: Timestamp.fromDate(user.createdAt),
        lastLoginAt: user.lastLoginAt ? Timestamp.fromDate(user.lastLoginAt) : null,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  static async getUser(uid: string): Promise<UserModel | null> {
    try {
      const userSnap = await getDoc(doc(db, this.COLLECTION_NAME, uid));
      
      if (userSnap.exists()) {
        return UserModel.fromFirestoreData({
          uid: userSnap.id,
          ...userSnap.data()
        });
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  }

  static async updateUser(user: UserModel): Promise<void> {
    try {
      const validation = user.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      await updateDoc(doc(db, this.COLLECTION_NAME, user.uid), {
        ...user.toFirestoreData(),
        lastLoginAt: user.lastLoginAt ? Timestamp.fromDate(user.lastLoginAt) : null,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  static async updateUserPreferences(uid: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION_NAME, uid), {
        preferences: preferences,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  static async updateLastLogin(uid: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION_NAME, uid), {
        lastLoginAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      throw new Error('Failed to update last login');
    }
  }

  static async createOrUpdateUser(user: UserModel): Promise<void> {
    try {
      const existingUser = await this.getUser(user.uid);
      if (existingUser) {
        // Update existing user
        user.createdAt = existingUser.createdAt; // Preserve original creation date
        await this.updateUser(user);
      } else {
        // Create new user
        await this.createUser(user);
      }
    } catch (error) {
      console.error('Error creating or updating user:', error);
      throw new Error('Failed to create or update user');
    }
  }
}
