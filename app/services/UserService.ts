import firestore from '@react-native-firebase/firestore';
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

      await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(user.uid)
        .set({
          ...user.toFirestoreData(),
          createdAt: firestore.Timestamp.fromDate(user.createdAt),
          lastLoginAt: user.lastLoginAt ? firestore.Timestamp.fromDate(user.lastLoginAt) : null,
        });
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  static async getUser(uid: string): Promise<UserModel | null> {
    try {
      const userSnap = await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(uid)
        .get();
      
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

      await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(user.uid)
        .update({
          ...user.toFirestoreData(),
          lastLoginAt: user.lastLoginAt ? firestore.Timestamp.fromDate(user.lastLoginAt) : null,
        });
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  static async updateUserPreferences(uid: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(uid)
        .update({
          preferences: preferences,
          updatedAt: firestore.Timestamp.now(),
        });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  static async updateLastLogin(uid: string): Promise<void> {
    try {
      await firestore()
        .collection(this.COLLECTION_NAME)
        .doc(uid)
        .update({
          lastLoginAt: firestore.Timestamp.now(),
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
