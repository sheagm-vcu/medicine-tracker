import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MedicationFormData, DosageUnit, DosageForm, FrequencyType, DayOfWeek } from '../types';
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
      Alert.alert('Invalid Time', 'Please enter time in HH:MM format (e.g., 09:00)');
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
      
      // Update formData with selected days
      const updatedFormData: MedicationFormData = {
        ...formData,
        daysOfWeek: formData.frequencyType === 'weekly' ? selectedDays : undefined,
      };

      const medication = MedicationModel.fromFormData(updatedFormData, userId);
      const validation = medication.validate();

      if (!validation.isValid) {
        Alert.alert('Validation Error', validation.errors.join('\n'));
        return;
      }

      if (initialData) {
        // Update existing medication
        medication.id = initialData.id;
        medication.createdAt = initialData.createdAt;
        await MedicationService.updateMedication(medication.id, medication);
        Alert.alert('Success', 'Medication updated successfully');
      } else {
        // Create new medication
        await MedicationService.createMedication(medication);
        Alert.alert('Success', 'Medication added successfully');
      }

      onSave();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 40 }}>
      <Container>
        <View className="py-6">
          <Text className="text-3xl font-bold mb-2 text-slate-900">Medication Details</Text>
          <Text className="text-slate-600 mb-6">Add a new medication to track</Text>

          <Card className="mb-5">
            <View className="mb-4 pb-3 border-b border-slate-200">
              <Text className="text-xl font-bold text-slate-900">Basic Information</Text>
              <Text className="text-sm text-slate-500 mt-1">Enter the medication name and details</Text>
            </View>
            
            <Input
              label="Medication Name *"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter medication name"
            />

            <Input
              label="Generic Name"
              value={formData.genericName || ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, genericName: text }))}
              placeholder="Enter generic name (optional)"
              helperText="The generic or scientific name of the medication"
            />
          </Card>

          <Card className="mb-5">
            <View className="mb-4 pb-3 border-b border-slate-200">
              <Text className="text-xl font-bold text-slate-900">Dosage Information</Text>
              <Text className="text-sm text-slate-500 mt-1">Specify how much to take</Text>
            </View>
            
            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Input
                  label="Amount *"
                  value={formData.dosageAmount?.toString() || ''}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || 0;
                    setFormData(prev => ({ ...prev, dosageAmount: num }));
                  }}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>

              <View className="flex-1 ml-2">
                <Text className="text-sm font-semibold mb-2 text-slate-700">Unit *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  <View className="flex-row">
                    {DOSAGE_UNITS.map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        onPress={() => setFormData(prev => ({ ...prev, dosageUnit: unit }))}
                        className={`px-4 py-2.5 rounded-xl mr-2 ${
                          formData.dosageUnit === unit 
                            ? 'bg-blue-600 shadow-md' 
                            : 'bg-slate-100 border border-slate-300'
                        }`}
                      >
                        <Text className={`font-semibold ${
                          formData.dosageUnit === unit ? 'text-white' : 'text-slate-700'
                        }`}>
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            <View>
              <Text className="text-sm font-semibold mb-2 text-slate-700">Form *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                <View className="flex-row">
                  {DOSAGE_FORMS.map((form) => (
                    <TouchableOpacity
                      key={form}
                      onPress={() => setFormData(prev => ({ ...prev, dosageForm: form }))}
                      className={`px-4 py-2.5 rounded-xl mr-2 ${
                        formData.dosageForm === form 
                          ? 'bg-blue-600 shadow-md' 
                          : 'bg-slate-100 border border-slate-300'
                      }`}
                    >
                      <Text className={`font-semibold capitalize ${
                        formData.dosageForm === form ? 'text-white' : 'text-slate-700'
                      }`}>
                        {form}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Card>

          <Card className="mb-5">
            <View className="mb-4 pb-3 border-b border-slate-200">
              <Text className="text-xl font-bold text-slate-900">Frequency & Schedule</Text>
              <Text className="text-sm text-slate-500 mt-1">When to take this medication</Text>
            </View>
            
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-3 text-slate-700">Frequency Type *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                <View className="flex-row">
                  {FREQUENCY_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setFormData(prev => ({ ...prev, frequencyType: type }))}
                      className={`px-4 py-2.5 rounded-xl mr-2 ${
                        formData.frequencyType === type 
                          ? 'bg-blue-600 shadow-md' 
                          : 'bg-slate-100 border border-slate-300'
                      }`}
                    >
                      <Text className={`font-semibold capitalize ${
                        formData.frequencyType === type ? 'text-white' : 'text-slate-700'
                      }`}>
                        {type.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {formData.frequencyType === 'daily' && (
              <Input
                label="Times Per Day"
                value={formData.timesPerDay?.toString() || ''}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  setFormData(prev => ({ ...prev, timesPerDay: num }));
                }}
                keyboardType="numeric"
                placeholder="1"
              />
            )}

            {formData.frequencyType === 'weekly' && (
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-3 text-slate-700">Days of Week</Text>
                <View className="flex-row flex-wrap">
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => toggleDay(day)}
                      className={`px-4 py-2.5 rounded-xl mr-2 mb-2 ${
                        selectedDays.includes(day) 
                          ? 'bg-blue-600 shadow-md' 
                          : 'bg-slate-100 border border-slate-300'
                      }`}
                    >
                      <Text className={`font-semibold ${
                        selectedDays.includes(day) ? 'text-white' : 'text-slate-700'
                      }`}>
                        {day.substring(0, 3).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {formData.frequencyType === 'custom' && (
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2 text-slate-700">Specific Times (HH:MM)</Text>
                <View className="flex-row mb-3">
                  <TextInput
                    className="flex-1 border border-slate-300 rounded-xl px-4 py-3 bg-white text-slate-900 mr-2"
                    value={specificTime}
                    onChangeText={setSpecificTime}
                    placeholder="09:00"
                    placeholderTextColor="#94a3b8"
                    maxLength={5}
                  />
                  <TouchableOpacity
                    onPress={addSpecificTime}
                    className="bg-blue-600 px-5 py-3 rounded-xl justify-center shadow-md"
                  >
                    <Text className="text-white font-semibold">Add</Text>
                  </TouchableOpacity>
                </View>
                {formData.specificTimes && formData.specificTimes.length > 0 && (
                  <View className="flex-row flex-wrap">
                    {formData.specificTimes.map((time) => (
                      <TouchableOpacity
                        key={time}
                        onPress={() => removeSpecificTime(time)}
                        className="bg-blue-100 px-3 py-1.5 rounded-lg mr-2 mb-2 border border-blue-200"
                      >
                        <Text className="text-blue-700 font-medium">{time} ×</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Card>

          <Card className="mb-5">
            <View className="mb-4 pb-3 border-b border-slate-200">
              <Text className="text-xl font-bold text-slate-900">Additional Information</Text>
              <Text className="text-sm text-slate-500 mt-1">Instructions and notes</Text>
            </View>
            
            <Input
              label="Instructions"
              value={formData.instructions || ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))}
              placeholder="e.g., Take with food"
              multiline
              numberOfLines={3}
              helperText="Special instructions for taking this medication"
            />

            <Input
              label="Notes"
              value={formData.notes || ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Additional notes (optional)"
              multiline
              numberOfLines={3}
              helperText="Any additional information about this medication"
            />
          </Card>

          <View className="flex-row mb-6 mt-2">
            <View className="flex-1 mr-2">
              <Button
                onPress={handleSave}
                disabled={loading}
                loading={loading}
                variant="primary"
                className="shadow-lg"
              >
                {initialData ? 'Update' : 'Save'} Medication
              </Button>
            </View>
            <View className="flex-1 ml-2">
              <Button
                onPress={onCancel}
                disabled={loading}
                variant="outline"
              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Container>
    </ScrollView>
  );
}

