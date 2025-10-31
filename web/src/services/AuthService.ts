import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../firebase.config';
import { UserModel } from '../models/User';
import { UserService } from './UserService';

export class AuthService {
  static async signUpWithEmail(email: string, password: string): Promise<UserModel> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userModel = UserModel.fromFirebaseUser(userCredential.user);
      await UserService.createOrUpdateUser(userModel);
      return userModel;
    } catch (error: any) {
      console.error('Error signing up with email:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  }

  static async signInWithEmail(email: string, password: string): Promise<UserModel> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userModel = UserModel.fromFirebaseUser(userCredential.user);
      await UserService.createOrUpdateUser(userModel);
      return userModel;
    } catch (error: any) {
      console.error('Error signing in with email:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  static async signInWithGoogle(): Promise<UserModel> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userModel = UserModel.fromFirebaseUser(result.user);
      await UserService.createOrUpdateUser(userModel);
      return userModel;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  static getCurrentUser(): UserModel | null {
    const user = auth.currentUser;
    return user ? UserModel.fromFirebaseUser(user) : null;
  }

  static onAuthStateChanged(callback: (user: UserModel | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userModel = UserModel.fromFirebaseUser(firebaseUser);
          await UserService.createOrUpdateUser(userModel);
          callback(userModel);
        } catch (error) {
          console.error('Error handling auth state change:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  static async updatePassword(newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      await firebaseUpdatePassword(user, newPassword);
    } catch (error: any) {
      console.error('Error updating password:', error);
      throw new Error(error.message || 'Failed to update password');
    }
  }
}
