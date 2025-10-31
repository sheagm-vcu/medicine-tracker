import { useState } from 'react';
import type { MedicationFormData, DosageUnit, DosageForm, FrequencyType, DayOfWeek } from '../types';
import { MedicationModel } from '../models/Medication';
import { MedicationService } from '../services/MedicationService';
import { Button } from '../components/Button';
import { Container } from '../components/Container';
import { Card } from '../components/Card';
import { Input } from '../components/Input';

interface MedicationDetailsFormProps {
  userId: string;
  onSave: () => void;
  onCancel: () => void;
  initialData?: MedicationModel;
}

const DOSAGE_UNITS: DosageUnit[] = ['mg', 'g', 'ml', 'tablets', 'capsules', 'drops', 'puffs', 'units'];
const DOSAGE_FORMS: DosageForm[] = ['tablet', 'capsule', 'liquid', 'injection', 'inhaler', 'patch', 'cream', 'drops'];
const FREQUENCY_TYPES: FrequencyType[] = ['daily', 'weekly', 'as_needed', 'custom'];
const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function MedicationDetailsForm({ userId, onSave, onCancel, initialData }: MedicationDetailsFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MedicationFormData>(() => {
    if (initialData) {
      return {
        name: initialData.name,
        genericName: initialData.genericName || '',
        dosageAmount: initialData.dosage.amount,
        dosageUnit: initialData.dosage.unit,
        dosageForm: initialData.dosage.form,
        frequencyType: initialData.frequency.type,
        timesPerDay: initialData.frequency.timesPerDay,
        daysOfWeek: initialData.frequency.daysOfWeek,
        interval: initialData.frequency.interval,
        specificTimes: initialData.frequency.specificTimes,
        instructions: initialData.instructions || '',
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        sideEffects: initialData.sideEffects || [],
        notes: initialData.notes || '',
      };
    }
    return {
      name: '',
      genericName: '',
      dosageAmount: 1,
      dosageUnit: 'mg',
      dosageForm: 'tablet',
      frequencyType: 'daily',
      timesPerDay: 1,
      specificTimes: ['09:00'],
      startDate: new Date(),
      notes: '',
    };
  });

  const [specificTime, setSpecificTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(formData.daysOfWeek || []);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const addSpecificTime = () => {
    if (specificTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(specificTime)) {
      setFormData(prev => ({
        ...prev,
        specificTimes: [...(prev.specificTimes || []), specificTime],
      }));
      setSpecificTime('');
    } else {
      alert('Invalid Time: Please enter time in HH:MM format (e.g., 09:00)');
    }
  };

  const removeSpecificTime = (time: string) => {
    setFormData(prev => ({
      ...prev,
      specificTimes: prev.specificTimes?.filter(t => t !== time) || [],
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const updatedFormData: MedicationFormData = {
        ...formData,
        daysOfWeek: formData.frequencyType === 'weekly' ? selectedDays : undefined,
      };

      const medication = MedicationModel.fromFormData(updatedFormData, userId);
      const validation = medication.validate();

      if (!validation.isValid) {
        alert('Validation Error:\n' + validation.errors.join('\n'));
        return;
      }

      if (initialData) {
        medication.id = initialData.id;
        medication.createdAt = initialData.createdAt;
        await MedicationService.updateMedication(medication.id, medication);
        alert('Success: Medication updated successfully');
      } else {
        await MedicationService.createMedication(medication);
        alert('Success: Medication added successfully');
      }

      onSave();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Container>
        <div className="py-6">
          <h1 className="text-3xl font-bold mb-2 text-slate-900">Medication Details</h1>
          <p className="text-slate-600 mb-6">Add a new medication to track</p>

          <Card className="mb-5">
            <div className="mb-4 pb-3 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Basic Information</h2>
              <p className="text-sm text-slate-500 mt-1">Enter the medication name and details</p>
            </div>
            
            <Input
              label="Medication Name *"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter medication name"
            />

            <Input
              label="Generic Name"
              value={formData.genericName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, genericName: e.target.value }))}
              placeholder="Enter generic name (optional)"
              helperText="The generic or scientific name of the medication"
            />
          </Card>

          <Card className="mb-5">
            <div className="mb-4 pb-3 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Dosage Information</h2>
              <p className="text-sm text-slate-500 mt-1">Specify how much to take</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input
                label="Amount *"
                type="number"
                value={formData.dosageAmount?.toString() || ''}
                onChange={(e) => {
                  const num = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({ ...prev, dosageAmount: num }));
                }}
                placeholder="1"
              />

              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">Unit *</label>
                <div className="flex flex-wrap gap-2">
                  {DOSAGE_UNITS.map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setFormData(prev => ({ ...prev, dosageUnit: unit }))}
                      className={`px-4 py-2.5 rounded-xl ${
                        formData.dosageUnit === unit 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-slate-100 border border-slate-300 text-slate-700'
                      } font-semibold hover:opacity-90`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">Form *</label>
              <div className="flex flex-wrap gap-2">
                {DOSAGE_FORMS.map((form) => (
                  <button
                    key={form}
                    onClick={() => setFormData(prev => ({ ...prev, dosageForm: form }))}
                    className={`px-4 py-2.5 rounded-xl capitalize ${
                      formData.dosageForm === form 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-slate-100 border border-slate-300 text-slate-700'
                    } font-semibold hover:opacity-90`}
                  >
                    {form}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="mb-5">
            <div className="mb-4 pb-3 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Frequency & Schedule</h2>
              <p className="text-sm text-slate-500 mt-1">When to take this medication</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-3 text-slate-700">Frequency Type *</label>
              <div className="flex flex-wrap gap-2">
                {FREQUENCY_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData(prev => ({ ...prev, frequencyType: type }))}
                    className={`px-4 py-2.5 rounded-xl capitalize ${
                      formData.frequencyType === type 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-slate-100 border border-slate-300 text-slate-700'
                    } font-semibold hover:opacity-90`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {formData.frequencyType === 'daily' && (
              <Input
                label="Times Per Day"
                type="number"
                value={formData.timesPerDay?.toString() || ''}
                onChange={(e) => {
                  const num = parseInt(e.target.value) || 1;
                  setFormData(prev => ({ ...prev, timesPerDay: num }));
                }}
                placeholder="1"
              />
            )}

            {formData.frequencyType === 'weekly' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-3 text-slate-700">Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2.5 rounded-xl ${
                        selectedDays.includes(day) 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'bg-slate-100 border border-slate-300 text-slate-700'
                      } font-semibold hover:opacity-90`}
                    >
                      {day.substring(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formData.frequencyType === 'custom' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-slate-700">Specific Times (HH:MM)</label>
                <div className="flex gap-2 mb-3">
                  <input
                    className="flex-1 border border-slate-300 rounded-xl px-4 py-3 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={specificTime}
                    onChange={(e) => setSpecificTime(e.target.value)}
                    placeholder="09:00"
                    maxLength={5}
                  />
                  <Button onClick={addSpecificTime} variant="primary">
                    Add
                  </Button>
                </div>
                {formData.specificTimes && formData.specificTimes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.specificTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => removeSpecificTime(time)}
                        className="bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 font-medium hover:bg-blue-200"
                      >
                        {time} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="mb-5">
            <div className="mb-4 pb-3 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Additional Information</h2>
              <p className="text-sm text-slate-500 mt-1">Instructions and notes</p>
            </div>
            
            <Input
              label="Instructions"
              value={formData.instructions || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="e.g., Take with food"
              helperText="Special instructions for taking this medication"
            />

            <Input
              label="Notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes (optional)"
              helperText="Any additional information about this medication"
            />
          </Card>

          <div className="flex gap-4 mb-6 mt-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              loading={loading}
              variant="primary"
              className="flex-1 shadow-lg"
            >
              {initialData ? 'Update' : 'Save'} Medication
            </Button>
            <Button
              onClick={onCancel}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
