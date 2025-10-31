import { StatusBar } from 'react-native';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { UserModel } from './models/User';
import { MedicationModel } from './models/Medication';
import { AuthService } from './services/AuthService';
import { MedicationService } from './services/MedicationService';
import { DosageUnit, DosageForm, FrequencyType } from './types';

export default function App() {
  const [user, setUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<MedicationModel[]>([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (userModel) => {
      if (userModel) {
        setUser(userModel);
        // Load user's medications
        await loadMedicines(userModel.uid);
      } else {
        setUser(null);
        setMedicines([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await AuthService.signInWithEmail('test@example.com', 'password123');
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message);
    }
  };

  const signUp = async () => {
    try {
      setIsCreatingUser(true);
      await AuthService.signUpWithEmail('test@example.com', 'password123');
    } catch (error: any) {
      Alert.alert('Sign Up Error', error.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await AuthService.signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Google Sign In Error', error.message);
    }
  };

  const logout = async () => {
    try {
      await AuthService.signOut();
    } catch (error: any) {
      Alert.alert('Logout Error', error.message);
    }
  };

  const addSampleMedicine = async () => {
    if (!user) return;
    
    try {
      const medication = new MedicationModel({
        userId: user.uid,
        name: 'Sample Medicine',
        genericName: 'Sample Generic',
        dosage: {
          amount: 10,
          unit: 'mg' as DosageUnit,
          form: 'tablet' as DosageForm,
        },
        frequency: {
          type: 'daily' as FrequencyType,
          timesPerDay: 1,
          specificTimes: ['09:00'],
        },
        instructions: 'Take with food',
        startDate: new Date(),
        isActive: true,
        notes: 'Sample medication for testing',
      });

      const medicationId = await MedicationService.createMedication(medication);
      Alert.alert('Success', 'Medicine added with ID: ' + medicationId);
      await loadMedicines(user.uid);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const loadMedicines = async (userId: string) => {
    try {
      const medications = await MedicationService.getMedicationsByUser(userId);
      setMedicines(medications);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const toggleMedicationStatus = async (medicationId: string) => {
    try {
      await MedicationService.toggleMedicationStatus(medicationId);
      if (user) {
        await loadMedicines(user.uid);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Medicine Tracker</Text>
      
      {user ? (
        <View style={styles.loggedInContainer}>
          <Text style={styles.welcomeText}>Welcome, {user.email}!</Text>
          
          <TouchableOpacity style={styles.button} onPress={addSampleMedicine}>
            <Text style={styles.buttonText}>Add Sample Medicine</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={() => user && loadMedicines(user.uid)}>
            <Text style={styles.buttonText}>Refresh Medicines</Text>
          </TouchableOpacity>
          
          <Text style={styles.medicinesTitle}>Medicines ({medicines.length})</Text>
          {medicines.map((medicine, index) => (
            <View key={medicine.id || index} style={styles.medicineCard}>
              <Text style={styles.medicineName}>{medicine.name}</Text>
              {medicine.genericName && (
                <Text style={styles.medicineGeneric}>({medicine.genericName})</Text>
              )}
              <Text style={styles.medicineDetails}>
                {medicine.getDosageString()} - {medicine.getFrequencyString()}
              </Text>
              {medicine.instructions && (
                <Text style={styles.medicineInstructions}>{medicine.instructions}</Text>
              )}
              <Text style={[
                styles.medicineStatus, 
                medicine.isActive ? styles.activeStatus : styles.inactiveStatus
              ]}>
                {medicine.isActive ? 'Active' : 'Inactive'}
              </Text>
              <TouchableOpacity 
                style={[styles.toggleButton, medicine.isActive ? styles.deactivateButton : styles.activateButton]}
                onPress={() => toggleMedicationStatus(medicine.id)}
              >
                <Text style={styles.toggleButtonText}>
                  {medicine.isActive ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={logout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.authContainer}>
          <Text style={styles.authText}>Please sign in to continue</Text>
          <TouchableOpacity 
            style={[styles.button, isCreatingUser && styles.disabledButton]} 
            onPress={signUp}
            disabled={isCreatingUser}
          >
            <Text style={styles.buttonText}>
              {isCreatingUser ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={signIn}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={signInWithGoogle}>
            <Text style={styles.buttonText}>Sign In with Google</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
    minHeight: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  loggedInContainer: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  authContainer: {
    width: '100%',
    alignItems: 'center',
  },
  authText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginTop: 20,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  medicinesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
    alignSelf: 'flex-start',
  },
  medicineCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  medicineGeneric: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  medicineDetails: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  medicineInstructions: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  medicineStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  activeStatus: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  inactiveStatus: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activateButton: {
    backgroundColor: '#28a745',
  },
  deactivateButton: {
    backgroundColor: '#dc3545',
  },
});
