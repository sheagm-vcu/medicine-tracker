import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MedicationService } from '../MedicationService';
import { MedicationModel } from '../../models/Medication';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase Firestore - must be defined inside vi.mock factory
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  const mockAddDoc = vi.fn();
  const mockUpdateDoc = vi.fn();
  const mockDeleteDoc = vi.fn();
  const mockGetDoc = vi.fn();
  const mockGetDocs = vi.fn();
  const mockCollection = vi.fn(() => ({}));
  const mockDoc = vi.fn(() => ({}));
  const mockQueryResult = {};
  const mockQuery = vi.fn((...args: any[]) => mockQueryResult);
  const mockWhere = vi.fn((q: any, ...args: any[]) => mockQueryResult);
  const mockOrderBy = vi.fn((q: any, ...args: any[]) => mockQueryResult);
  const mockLimit = vi.fn((q: any, ...args: any[]) => mockQueryResult);

  // Store mocks globally so tests can access them
  (global as any).mockAddDoc = mockAddDoc;
  (global as any).mockUpdateDoc = mockUpdateDoc;
  (global as any).mockDeleteDoc = mockDeleteDoc;
  (global as any).mockGetDoc = mockGetDoc;
  (global as any).mockGetDocs = mockGetDocs;
  (global as any).mockCollection = mockCollection;
  (global as any).mockDoc = mockDoc;
  (global as any).mockQuery = mockQuery;
  (global as any).mockWhere = mockWhere;
  (global as any).mockOrderBy = mockOrderBy;
  (global as any).mockLimit = mockLimit;

  return {
    ...actual,
    collection: mockCollection,
    doc: mockDoc,
    addDoc: mockAddDoc,
    updateDoc: mockUpdateDoc,
    deleteDoc: mockDeleteDoc,
    getDoc: mockGetDoc,
    getDocs: mockGetDocs,
    query: mockQuery,
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    Timestamp: {
      fromDate: (date: Date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
      }),
    },
  };
});

vi.mock('../../firebase.config', () => ({
  db: {},
}));

// Access mocks from global
const mockAddDoc = () => (global as any).mockAddDoc;
const mockUpdateDoc = () => (global as any).mockUpdateDoc;
const mockDeleteDoc = () => (global as any).mockDeleteDoc;
const mockGetDoc = () => (global as any).mockGetDoc;
const mockGetDocs = () => (global as any).mockGetDocs;
const mockCollection = () => (global as any).mockCollection;
const mockDoc = () => (global as any).mockDoc;
const mockQuery = () => (global as any).mockQuery;
const mockWhere = () => (global as any).mockWhere;
const mockOrderBy = () => (global as any).mockOrderBy;
const mockLimit = () => (global as any).mockLimit;

describe('MedicationService', () => {
  const userId = 'test-user-123';
  
  const createMockMedication = (overrides: Partial<any> = {}): MedicationModel => {
    return new MedicationModel({
      id: 'med-123',
      userId,
      name: 'Test Medication',
      genericName: 'Test Generic',
      dosage: {
        amount: 100,
        unit: 'mg',
        form: 'tablet',
        quantity: 1,
      },
      frequency: {
        type: 'daily',
        timesPerDay: 2,
        timeOfDay: '09:00',
      },
      instructions: 'Take with food',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      refillDate: new Date('2024-06-01'),
      isActive: true,
      notes: 'Test notes',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global mocks
    if ((global as any).mockAddDoc) (global as any).mockAddDoc.mockClear();
    if ((global as any).mockUpdateDoc) (global as any).mockUpdateDoc.mockClear();
    if ((global as any).mockDeleteDoc) (global as any).mockDeleteDoc.mockClear();
    if ((global as any).mockGetDoc) (global as any).mockGetDoc.mockClear();
    if ((global as any).mockGetDocs) (global as any).mockGetDocs.mockClear();
  });

  describe('createMedication', () => {
    it('should successfully create a medication', async () => {
      const medication = createMockMedication({ id: '' });
      const mockDocRef = { id: 'new-med-id' };
      
      mockAddDoc().mockResolvedValue(mockDocRef);
      
      const result = await MedicationService.createMedication(medication);
      
      expect(result).toBe('new-med-id');
      expect(mockAddDoc()).toHaveBeenCalled();
      expect(mockCollection()).toHaveBeenCalledWith({}, 'medications');
    });

    it('should throw error if validation fails', async () => {
      const medication = createMockMedication({ name: '' }); // Invalid: empty name
      
      await expect(MedicationService.createMedication(medication)).rejects.toThrow();
      expect(mockAddDoc()).not.toHaveBeenCalled();
    });

    it('should remove undefined values before saving', async () => {
      const medication = createMockMedication({
        frequency: {
          type: 'daily',
          timesPerDay: 1,
          daysOfWeek: undefined, // This should be removed
          specificTimes: undefined, // This should be removed
        },
      });
      const mockDocRef = { id: 'new-med-id' };
      
      mockAddDoc().mockResolvedValue(mockDocRef);
      
      await MedicationService.createMedication(medication);
      
      const callArgs = mockAddDoc().mock.calls[0][1];
      expect(callArgs.frequency.daysOfWeek).toBeUndefined();
      expect(callArgs.frequency.specificTimes).toBeUndefined();
    });

    it('should handle daily frequency validation', async () => {
      const medication = createMockMedication({
        frequency: {
          type: 'daily',
          timesPerDay: 0, // Invalid
        },
      });
      
      await expect(MedicationService.createMedication(medication)).rejects.toThrow();
      expect(mockAddDoc()).not.toHaveBeenCalled();
    });

    it('should handle weekly frequency validation', async () => {
      const medication = createMockMedication({
        frequency: {
          type: 'weekly',
          daysOfWeek: [], // Invalid: empty array
        },
      });
      
      await expect(MedicationService.createMedication(medication)).rejects.toThrow();
      expect(mockAddDoc()).not.toHaveBeenCalled();
    });
  });

  describe('updateMedication', () => {
    it('should successfully update a medication', async () => {
      const medication = createMockMedication({ id: 'med-123' });
      
      mockUpdateDoc().mockResolvedValue(undefined);
      
      await MedicationService.updateMedication('med-123', medication);
      
      expect(mockUpdateDoc()).toHaveBeenCalled();
      expect(mockDoc()).toHaveBeenCalledWith({}, 'medications', 'med-123');
    });

    it('should throw error if validation fails', async () => {
      const medication = createMockMedication({
        name: '', // Invalid: empty name
      });
      
      await expect(MedicationService.updateMedication('med-123', medication)).rejects.toThrow();
      expect(mockUpdateDoc()).not.toHaveBeenCalled();
    });

    it('should update medication with new values', async () => {
      const medication = createMockMedication({
        name: 'Updated Medication',
        notes: 'Updated notes',
      });
      
      mockUpdateDoc().mockResolvedValue(undefined);
      
      await MedicationService.updateMedication('med-123', medication);
      
      expect(mockUpdateDoc()).toHaveBeenCalled();
      const updateData = mockUpdateDoc().mock.calls[0][1];
      expect(updateData.name).toBe('Updated Medication');
      expect(updateData.notes).toBe('Updated notes');
    });
  });

  describe('deleteMedication', () => {
    it('should successfully delete a medication', async () => {
      mockDeleteDoc().mockResolvedValue(undefined);
      
      await MedicationService.deleteMedication('med-123');
      
      expect(mockDeleteDoc()).toHaveBeenCalled();
      expect(mockDoc()).toHaveBeenCalledWith({}, 'medications', 'med-123');
    });

    it('should throw error if ID is empty', async () => {
      await expect(MedicationService.deleteMedication('')).rejects.toThrow(
        'Invalid medication ID'
      );
      expect(mockDeleteDoc()).not.toHaveBeenCalled();
    });

    it('should throw error if ID is whitespace only', async () => {
      await expect(MedicationService.deleteMedication('   ')).rejects.toThrow(
        'Invalid medication ID'
      );
      expect(mockDeleteDoc()).not.toHaveBeenCalled();
    });
  });

  describe('getMedication', () => {
    it('should successfully retrieve a medication', async () => {
      const mockData = {
        userId,
        name: 'Test Medication',
        dosage: { amount: 100, unit: 'mg', form: 'tablet', quantity: 1 },
        frequency: { type: 'daily', timesPerDay: 2 },
        startDate: Timestamp.fromDate(new Date('2024-01-01')),
        isActive: true,
        createdAt: Timestamp.fromDate(new Date('2024-01-01')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-01')),
      };
      
      const mockDocSnap = {
        exists: () => true,
        id: 'med-123',
        data: () => mockData,
      };
      
      mockGetDoc().mockResolvedValue(mockDocSnap);
      
      const result = await MedicationService.getMedication('med-123');
      
      expect(result).toBeInstanceOf(MedicationModel);
      expect(result?.id).toBe('med-123');
      expect(result?.name).toBe('Test Medication');
      expect(mockGetDoc()).toHaveBeenCalled();
    });

    it('should return null if medication does not exist', async () => {
      const mockDocSnap = {
        exists: () => false,
        id: 'med-123',
        data: () => null,
      };
      
      mockGetDoc().mockResolvedValue(mockDocSnap);
      
      const result = await MedicationService.getMedication('med-123');
      
      expect(result).toBeNull();
    });
  });

  describe('getMedicationsByUser', () => {
    it('should successfully retrieve medications for a user', async () => {
      const mockData1 = {
        userId,
        name: 'Medication 1',
        dosage: { amount: 100, unit: 'mg', form: 'tablet', quantity: 1 },
        frequency: { type: 'daily', timesPerDay: 1 },
        startDate: Timestamp.fromDate(new Date('2024-01-01')),
        isActive: true,
        createdAt: Timestamp.fromDate(new Date('2024-01-01')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-01')),
      };
      
      const mockData2 = {
        userId,
        name: 'Medication 2',
        dosage: { amount: 200, unit: 'mg', form: 'capsule', quantity: 2 },
        frequency: { type: 'weekly', daysOfWeek: ['monday', 'wednesday'] },
        startDate: Timestamp.fromDate(new Date('2024-01-02')),
        isActive: false,
        createdAt: Timestamp.fromDate(new Date('2024-01-02')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-02')),
      };
      
      const mockQuerySnapshot = {
        docs: [
          { id: 'med-1', data: () => mockData1 },
          { id: 'med-2', data: () => mockData2 },
        ],
      };
      
      mockGetDocs().mockResolvedValue(mockQuerySnapshot);
      
      const result = await MedicationService.getMedicationsByUser(userId);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(MedicationModel);
      expect(result[0].name).toBe('Medication 1');
      expect(result[1].name).toBe('Medication 2');
    });

    it('should filter medications by active status', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'med-1',
            data: () => ({
              userId,
              name: 'Active Med',
              dosage: { amount: 100, unit: 'mg', form: 'tablet', quantity: 1 },
              frequency: { type: 'daily', timesPerDay: 1 },
              startDate: Timestamp.fromDate(new Date('2024-01-01')),
              isActive: true,
              createdAt: Timestamp.fromDate(new Date('2024-01-01')),
              updatedAt: Timestamp.fromDate(new Date('2024-01-01')),
            }),
          },
        ],
      };
      
      mockGetDocs().mockResolvedValue(mockQuerySnapshot);
      
      const result = await MedicationService.getMedicationsByUser(userId, { isActive: true });
      
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it('should filter medications by search term', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'med-1',
            data: () => ({
              userId,
              name: 'Aspirin',
              dosage: { amount: 100, unit: 'mg', form: 'tablet', quantity: 1 },
              frequency: { type: 'daily', timesPerDay: 1 },
              startDate: Timestamp.fromDate(new Date('2024-01-01')),
              isActive: true,
              createdAt: Timestamp.fromDate(new Date('2024-01-01')),
              updatedAt: Timestamp.fromDate(new Date('2024-01-01')),
            }),
          },
          {
            id: 'med-2',
            data: () => ({
              userId,
              name: 'Ibuprofen',
              dosage: { amount: 200, unit: 'mg', form: 'tablet', quantity: 1 },
              frequency: { type: 'daily', timesPerDay: 1 },
              startDate: Timestamp.fromDate(new Date('2024-01-01')),
              isActive: true,
              createdAt: Timestamp.fromDate(new Date('2024-01-01')),
              updatedAt: Timestamp.fromDate(new Date('2024-01-01')),
            }),
          },
        ],
      };
      
      mockGetDocs().mockResolvedValue(mockQuerySnapshot);
      
      const result = await MedicationService.getMedicationsByUser(userId, { searchTerm: 'Aspirin' });
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Aspirin');
    });
  });

  describe('toggleMedicationStatus (deactivate)', () => {
    it('should successfully deactivate an active medication', async () => {
      const activeMedication = createMockMedication({ id: 'med-123', isActive: true });
      
      mockGetDoc().mockResolvedValue({
        exists: () => true,
        id: 'med-123',
        data: () => ({
          ...activeMedication.toFirestoreData(),
          createdAt: Timestamp.fromDate(activeMedication.createdAt),
          updatedAt: Timestamp.fromDate(activeMedication.updatedAt),
          startDate: Timestamp.fromDate(activeMedication.startDate),
        }),
      });
      mockUpdateDoc().mockResolvedValue(undefined);
      
      await MedicationService.toggleMedicationStatus('med-123');
      
      expect(mockGetDoc()).toHaveBeenCalled();
      expect(mockUpdateDoc()).toHaveBeenCalled();
      
      // Verify the medication was toggled
      const updateCall = mockUpdateDoc().mock.calls[0];
      const updateData = updateCall[1];
      expect(updateData.isActive).toBe(false);
    });

    it('should successfully activate an inactive medication', async () => {
      const inactiveMedication = createMockMedication({ id: 'med-123', isActive: false });
      
      mockGetDoc().mockResolvedValue({
        exists: () => true,
        id: 'med-123',
        data: () => ({
          ...inactiveMedication.toFirestoreData(),
          createdAt: Timestamp.fromDate(inactiveMedication.createdAt),
          updatedAt: Timestamp.fromDate(inactiveMedication.updatedAt),
          startDate: Timestamp.fromDate(inactiveMedication.startDate),
        }),
      });
      mockUpdateDoc().mockResolvedValue(undefined);
      
      await MedicationService.toggleMedicationStatus('med-123');
      
      expect(mockGetDoc()).toHaveBeenCalled();
      expect(mockUpdateDoc()).toHaveBeenCalled();
      
      const updateCall = mockUpdateDoc().mock.calls[0];
      const updateData = updateCall[1];
      expect(updateData.isActive).toBe(true);
    });

    it('should throw error if medication not found', async () => {
      mockGetDoc().mockResolvedValue({
        exists: () => false,
        id: 'med-123',
        data: () => null,
      });
      
      await expect(MedicationService.toggleMedicationStatus('med-123')).rejects.toThrow();
      expect(mockUpdateDoc()).not.toHaveBeenCalled();
    });
  });

  describe('getActiveMedications', () => {
    it('should return only active medications', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'med-1',
            data: () => ({
              userId,
              name: 'Active Med',
              dosage: { amount: 100, unit: 'mg', form: 'tablet', quantity: 1 },
              frequency: { type: 'daily', timesPerDay: 1 },
              startDate: Timestamp.fromDate(new Date('2024-01-01')),
              isActive: true,
              createdAt: Timestamp.fromDate(new Date('2024-01-01')),
              updatedAt: Timestamp.fromDate(new Date('2024-01-01')),
            }),
          },
        ],
      };
      
      mockGetDocs().mockResolvedValue(mockQuerySnapshot);
      
      const result = await MedicationService.getActiveMedications(userId);
      
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
      // Verify that where was called multiple times (for userId and isActive)
      expect(mockWhere().mock.calls.length).toBeGreaterThanOrEqual(2);
      // Verify that isActive filter was applied
      const isActiveCall = mockWhere().mock.calls.find(call => 
        call.includes('isActive') && call.includes(true)
      );
      expect(isActiveCall).toBeDefined();
    });
  });

  describe('getExpiredMedications', () => {
    it('should return only expired medications', async () => {
      const pastDate = new Date('2023-01-01');
      const futureDate = new Date('2025-12-31');
      
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'med-1',
            data: () => ({
              userId,
              name: 'Expired Med',
              dosage: { amount: 100, unit: 'mg', form: 'tablet', quantity: 1 },
              frequency: { type: 'daily', timesPerDay: 1 },
              startDate: Timestamp.fromDate(pastDate),
              endDate: Timestamp.fromDate(pastDate),
              isActive: false,
              createdAt: Timestamp.fromDate(pastDate),
              updatedAt: Timestamp.fromDate(pastDate),
            }),
          },
          {
            id: 'med-2',
            data: () => ({
              userId,
              name: 'Active Med',
              dosage: { amount: 100, unit: 'mg', form: 'tablet', quantity: 1 },
              frequency: { type: 'daily', timesPerDay: 1 },
              startDate: Timestamp.fromDate(pastDate),
              endDate: Timestamp.fromDate(futureDate),
              isActive: true,
              createdAt: Timestamp.fromDate(pastDate),
              updatedAt: Timestamp.fromDate(pastDate),
            }),
          },
        ],
      };
      
      mockGetDocs().mockResolvedValue(mockQuerySnapshot);
      
      const result = await MedicationService.getExpiredMedications(userId);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Expired Med');
      expect(result[0].isExpired()).toBe(true);
    });
  });
});
