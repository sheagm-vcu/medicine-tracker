import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '../lib/google-signin';
import { UserModel } from '../models/User';
import { UserService } from './UserService';

export class AuthService {
  static async signUpWithEmail(email: string, password: string): Promise<UserModel> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
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
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
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
      // Ensure Google Play Services available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get the user ID token
      const { idToken } = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCred = auth.GoogleAuthProvider.credential(idToken);

      // Sign in with credential
      const userCredential = await auth().signInWithCredential(googleCred);
      const userModel = UserModel.fromFirebaseUser(userCredential.user);
      await UserService.createOrUpdateUser(userModel);
      return userModel;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  static async signOut(): Promise<void> {
    try {
      await auth().signOut();
      await GoogleSignin.signOut();
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  static getCurrentUser(): UserModel | null {
    const user = auth().currentUser;
    return user ? UserModel.fromFirebaseUser(user) : null;
  }

  static onAuthStateChanged(callback: (user: UserModel | null) => void): () => void {
    return auth().onAuthStateChanged(async (firebaseUser) => {
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
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  static async updatePassword(newPassword: string): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }
      await user.updatePassword(newPassword);
    } catch (error: any) {
      console.error('Error updating password:', error);
      throw new Error(error.message || 'Failed to update password');
    }
  }
}
