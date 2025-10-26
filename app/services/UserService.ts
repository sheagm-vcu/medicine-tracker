import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { UserModel } from '../models/User';
import { UserPreferences } from '../types';

export class UserService {
  private static readonly COLLECTION_NAME = 'users';

  static async createUser(user: UserModel): Promise<void> {
    try {
      const validation = user.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const userRef = doc(db, this.COLLECTION_NAME, user.uid);
      await setDoc(userRef, {
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
      const userRef = doc(db, this.COLLECTION_NAME, uid);
      const userSnap = await getDoc(userRef);
      
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

      const userRef = doc(db, this.COLLECTION_NAME, user.uid);
      await updateDoc(userRef, {
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
      const userRef = doc(db, this.COLLECTION_NAME, uid);
      await updateDoc(userRef, {
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
      const userRef = doc(db, this.COLLECTION_NAME, uid);
      await updateDoc(userRef, {
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
