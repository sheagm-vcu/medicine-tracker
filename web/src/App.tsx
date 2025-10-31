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
  const [editingMedication, setEditingMedication] = useState<MedicationModel | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; medication: MedicationModel | null }>({
    show: false,
    medication: null,
  });

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
    setEditingMedication(null);
    if (user) {
      await loadMedicines(user.uid);
    }
  };

  const handleEdit = (medicine: MedicationModel) => {
    setEditingMedication(medicine);
    setShowMedicationForm(true);
  };

  const handleDeleteClick = (medicine: MedicationModel) => {
    setDeleteConfirmation({ show: true, medication: medicine });
  };

  const handleDeactivate = async (medication: MedicationModel) => {
    try {
      await MedicationService.toggleMedicationStatus(medication.id);
      setDeleteConfirmation({ show: false, medication: null });
      if (user) {
        await loadMedicines(user.uid);
      }
    } catch (error: any) {
      alert('Error deactivating medication: ' + error.message);
    }
  };

  const handleDeletePermanently = async (medication: MedicationModel) => {
    if (window.confirm(`Are you sure you want to permanently delete "${medication.name}"? This action cannot be undone.`)) {
      try {
        await MedicationService.deleteMedication(medication.id);
        setDeleteConfirmation({ show: false, medication: null });
        if (user) {
          await loadMedicines(user.uid);
        }
      } catch (error: any) {
        alert('Error deleting medication: ' + error.message);
      }
    }
  };

  const loadMedicines = async (userId: string) => {
    try {
      const medications = await MedicationService.getMedicationsByUser(userId);
      // Sort: active medications first, then inactive (both by creation date)
      const sorted = [...medications].sort((a, b) => {
        if (a.isActive === b.isActive) {
          return b.createdAt.getTime() - a.createdAt.getTime(); // Newest first within same status
        }
        return a.isActive ? -1 : 1; // Active first
      });
      setMedicines(sorted);
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
        onCancel={() => {
          setShowMedicationForm(false);
          setEditingMedication(null);
        }}
        initialData={editingMedication || undefined}
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
                </div>
                
                <h2 className="text-xl font-bold mb-4 text-slate-900">
                  Medicines ({medicines.length})
                </h2>
              </div>

              <div className="space-y-4">
                {medicines.map((medicine, index) => (
                  <Card key={medicine.id || index} className="relative">
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
                    
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        medicine.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {medicine.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Edit and Delete icons at bottom right */}
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(medicine)}
                        className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                        title="Edit medication"
                        aria-label="Edit medication"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (!medicine.id || medicine.id.trim() === '') {
                            alert('Cannot delete medication: Invalid ID');
                            return;
                          }
                          handleDeleteClick(medicine);
                        }}
                        className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                        title="Delete medication"
                        aria-label="Delete medication"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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

              {/* Delete Confirmation Popover */}
              {deleteConfirmation.show && deleteConfirmation.medication && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <Card className="max-w-md w-full mx-4">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Medication</h3>
                      <p className="text-slate-700 mb-4">
                        What would you like to do with "{deleteConfirmation.medication.name}"?
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Button
                        onClick={() => handleDeactivate(deleteConfirmation.medication!)}
                        variant="secondary"
                        className="w-full"
                      >
                        Deactivate
                      </Button>
                      <p className="text-xs text-slate-500 text-center">
                        Medication will be saved but marked as inactive and moved to the bottom of the list
                      </p>
                      
                      <div className="border-t border-slate-200 pt-3">
                        <Button
                          onClick={() => handleDeletePermanently(deleteConfirmation.medication!)}
                          variant="primary"
                          className="w-full bg-red-600 hover:bg-red-700"
                        >
                          Delete Permanently
                        </Button>
                        <p className="text-xs text-red-600 text-center mt-2">
                          This action cannot be undone
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => setDeleteConfirmation({ show: false, medication: null })}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
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
