import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { MedicationModel } from '../models/Medication';
import type { MedicationFilters, PaginationOptions } from '../types';

export class MedicationService {
  private static readonly COLLECTION_NAME = 'medications';

  static async createMedication(medication: MedicationModel): Promise<string> {
    try {
      const validation = medication.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...medication.toFirestoreData(),
        createdAt: Timestamp.fromDate(medication.createdAt),
        updatedAt: Timestamp.fromDate(medication.updatedAt),
        startDate: Timestamp.fromDate(medication.startDate),
        endDate: medication.endDate ? Timestamp.fromDate(medication.endDate) : null,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating medication:', error);
      throw new Error('Failed to create medication');
    }
  }

  static async updateMedication(id: string, medication: MedicationModel): Promise<void> {
    try {
      const validation = medication.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      await updateDoc(doc(db, this.COLLECTION_NAME, id), {
        ...medication.toFirestoreData(),
        updatedAt: Timestamp.fromDate(medication.updatedAt),
        startDate: Timestamp.fromDate(medication.startDate),
        endDate: medication.endDate ? Timestamp.fromDate(medication.endDate) : null,
      });
    } catch (error) {
      console.error('Error updating medication:', error);
      throw new Error('Failed to update medication');
    }
  }

  static async deleteMedication(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, id));
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw new Error('Failed to delete medication');
    }
  }

  static async getMedication(id: string): Promise<MedicationModel | null> {
    try {
      const medicationSnap = await getDoc(doc(db, this.COLLECTION_NAME, id));
      
      if (medicationSnap.exists()) {
        return MedicationModel.fromFirestoreData({
          id: medicationSnap.id,
          ...medicationSnap.data()
        });
      }
      return null;
    } catch (error) {
      console.error('Error getting medication:', error);
      throw new Error('Failed to get medication');
    }
  }

  static async getMedicationsByUser(
    userId: string, 
    filters?: MedicationFilters,
    pagination?: PaginationOptions
  ): Promise<MedicationModel[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );

      // Apply filters
      if (filters?.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      if (filters?.startDate) {
        q = query(q, where('startDate', '>=', Timestamp.fromDate(filters.startDate)));
      }

      if (filters?.endDate) {
        q = query(q, where('endDate', '<=', Timestamp.fromDate(filters.endDate)));
      }

      if (filters?.dosageForm) {
        q = query(q, where('dosage.form', '==', filters.dosageForm));
      }

      // Apply ordering
      const orderByField = pagination?.orderBy || 'createdAt';
      const orderDirection = pagination?.orderDirection || 'desc';
      q = query(q, orderBy(orderByField, orderDirection));

      // Apply pagination
      if (pagination?.limit) {
        q = query(q, limit(pagination.limit));
      }

      const querySnapshot = await getDocs(q);
      const medications = querySnapshot.docs.map(doc => 
        MedicationModel.fromFirestoreData({
          id: doc.id,
          ...doc.data()
        })
      );

      // Apply search filter if provided (client-side)
      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        return medications.filter(med => 
          med.name.toLowerCase().includes(searchTerm) ||
          med.genericName?.toLowerCase().includes(searchTerm) ||
          med.instructions?.toLowerCase().includes(searchTerm)
        );
      }

      return medications;
    } catch (error: any) {
      console.error('Error getting medications:', error);
      throw new Error('Failed to get medications');
    }
  }

  static async getActiveMedications(userId: string): Promise<MedicationModel[]> {
    return this.getMedicationsByUser(userId, { isActive: true });
  }

  static async getExpiredMedications(userId: string): Promise<MedicationModel[]> {
    const allMedications = await this.getMedicationsByUser(userId);
    return allMedications.filter(med => med.isExpired());
  }

  static async searchMedications(userId: string, searchTerm: string): Promise<MedicationModel[]> {
    return this.getMedicationsByUser(userId, { searchTerm });
  }

  static async getMedicationsByDosageForm(
    userId: string, 
    dosageForm: string
  ): Promise<MedicationModel[]> {
    return this.getMedicationsByUser(userId, { dosageForm: dosageForm as any });
  }

  static async toggleMedicationStatus(id: string): Promise<void> {
    try {
      const medication = await this.getMedication(id);
      if (!medication) {
        throw new Error('Medication not found');
      }

      medication.toggleActive();
      await this.updateMedication(id, medication);
    } catch (error) {
      console.error('Error toggling medication status:', error);
      throw new Error('Failed to toggle medication status');
    }
  }
}
