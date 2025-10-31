import { useState, useEffect } from 'react';
import { UserModel } from './models/User';
import { MedicationModel } from './models/Medication';
import { AuthService } from './services/AuthService';
import { MedicationService } from './services/MedicationService';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Container } from './components/Container';
import { MedicationDetailsForm } from './screens/MedicationDetailsForm';
import './style.css';

function App() {
  const [user, setUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<MedicationModel[]>([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (userModel) => {
      if (userModel) {
        setUser(userModel);
        // Load user's medications (don't fail if index isn't created yet)
        try {
          await loadMedicines(userModel.uid);
        } catch (error: any) {
          console.warn('Could not load medications (index may need to be created):', error.message);
          // Set empty array - medications will load once index is created
          setMedicines([]);
        }
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
      alert('Sign In Error: ' + error.message);
    }
  };

  const signUp = async () => {
    try {
      setIsCreatingUser(true);
      await AuthService.signUpWithEmail('test@example.com', 'password123');
    } catch (error: any) {
      alert('Sign Up Error: ' + error.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      await AuthService.signInWithGoogle();
    } catch (error: any) {
      alert('Google Sign In Error: ' + error.message);
    }
  };

  const logout = async () => {
    try {
      await AuthService.signOut();
    } catch (error: any) {
      alert('Logout Error: ' + error.message);
    }
  };

  const handleMedicationSave = async () => {
    setShowMedicationForm(false);
    if (user) {
      await loadMedicines(user.uid);
    }
  };

  const loadMedicines = async (userId: string) => {
    try {
      const medications = await MedicationService.getMedicationsByUser(userId);
      setMedicines(medications);
    } catch (error: any) {
      // Don't show alert for index errors - they're expected until index is created
      if (error.message?.includes('index') || error.message?.includes('failed-precondition')) {
        console.warn('Medication index not yet created:', error.message);
        setMedicines([]);
      } else {
        alert('Error: ' + error.message);
      }
    }
  };

  const toggleMedicationStatus = async (medicationId: string) => {
    try {
      await MedicationService.toggleMedicationStatus(medicationId);
      if (user) {
        await loadMedicines(user.uid);
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  // Show medication form if user is logged in and form should be visible
  if (user && showMedicationForm) {
    return (
      <MedicationDetailsForm
        userId={user.uid}
        onSave={handleMedicationSave}
        onCancel={() => setShowMedicationForm(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Container>
        <div className="py-8">
          <h1 className="text-3xl font-bold mb-8 text-slate-900 text-center">Medicine Tracker</h1>
          
          {user ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 text-center">
                <p className="text-lg text-slate-700 mb-6">Welcome, {user.email}!</p>
                
                <div className="flex gap-4 justify-center mb-6">
                  <Button onClick={() => setShowMedicationForm(true)}>
                    Add a Medication
                  </Button>
                  
                  <Button onClick={() => user && loadMedicines(user.uid)} variant="secondary">
                    Refresh Medicines
                  </Button>
                </div>
                
                <h2 className="text-xl font-bold mb-4 text-slate-900">
                  Medicines ({medicines.length})
                </h2>
              </div>

              <div className="space-y-4">
                {medicines.map((medicine, index) => (
                  <Card key={medicine.id || index}>
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{medicine.name}</h3>
                      {medicine.genericName && (
                        <p className="text-slate-600 italic mb-2">({medicine.genericName})</p>
                      )}
                      <p className="text-slate-700 mb-2">
                        {medicine.getDosageString()} - {medicine.getFrequencyString()}
                      </p>
                      {medicine.instructions && (
                        <p className="text-sm text-slate-600 italic mb-2">{medicine.instructions}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        medicine.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {medicine.isActive ? 'Active' : 'Inactive'}
                      </span>
                      
                      <Button
                        onClick={() => toggleMedicationStatus(medicine.id)}
                        variant={medicine.isActive ? 'secondary' : 'primary'}
                        className="ml-4"
                      >
                        {medicine.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </Card>
                ))}
                
                {medicines.length === 0 && (
                  <Card>
                    <p className="text-center text-slate-600">No medications yet. Add one to get started!</p>
                  </Card>
                )}
              </div>
              
              <div className="mt-8 text-center">
                <Button onClick={logout} variant="outline">
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <Card>
                <div className="text-center">
                  <p className="text-lg text-slate-700 mb-6">Please sign in to continue</p>
                  
                  <div className="space-y-4">
                    <Button 
                      onClick={signUp}
                      disabled={isCreatingUser}
                      loading={isCreatingUser}
                      className="w-full"
                    >
                      {isCreatingUser ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                    
                    <Button 
                      onClick={signIn}
                      variant="secondary"
                      className="w-full"
                    >
                      Sign In
                    </Button>
                    
                    <Button 
                      onClick={signInWithGoogle}
                      variant="outline"
                      className="w-full"
                    >
                      Sign In with Google
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

export default App;
