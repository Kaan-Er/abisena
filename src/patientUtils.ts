import type {
  Language,
  PatientFormData,
  PatientPriority,
  PatientRecord,
  PatientStatus,
  SortKey,
} from './types';

export const statuses: PatientStatus[] = [
  'Bekliyor',
  'Muayenede',
  'Tamamlandı',
  'İptal',
];

export const priorities: PatientPriority[] = ['normal', 'acil'];

export const fallbackDepartments = [
  'Dahiliye',
  'Kardiyoloji',
  'Nöroloji',
  'Ortopedi',
  'Pediatri',
];

export const bloodTypes = ['0+', '0-', 'A+', 'A-', 'AB+', 'AB-', 'B+', 'B-'];

export function createEmptyForm(): PatientFormData {
  const today = new Date().toISOString().slice(0, 10);

  return {
    fullName: '',
    birthDate: '1990-01-01',
    appointmentDate: today,
    department: fallbackDepartments[0],
    status: 'Bekliyor',
    priority: 'normal',
    bloodType: 'A+',
    score: 3,
    note_tr: '',
    note_en: '',
    diagnosis_tr: '',
    diagnosis_en: '',
    isInsured: true,
    isFollowUp: false,
    isVaccinated: true,
    tags: [],
    notes: '',
  };
}

export function formFromPatient(patient: PatientRecord): PatientFormData {
  return {
    fullName: patient.fullName,
    birthDate: toDateInput(patient.birthDate),
    appointmentDate: toDateInput(patient.appointmentDate),
    department: patient.department,
    status: patient.status,
    priority: patient.priority,
    bloodType: patient.bloodType,
    score: patient.score,
    note_tr: patient.note_tr,
    note_en: patient.note_en,
    diagnosis_tr: patient.diagnosis_tr,
    diagnosis_en: patient.diagnosis_en,
    isInsured: patient.isInsured,
    isFollowUp: patient.isFollowUp,
    isVaccinated: patient.isVaccinated,
    tags: patient.tags,
    notes: patient.notes ?? '',
  };
}

export function makePatient(form: PatientFormData): PatientRecord {
  return {
    id: `local-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    ...normalizeForm(form),
  };
}

export function updatePatient(
  original: PatientRecord,
  form: PatientFormData,
): PatientRecord {
  return {
    ...original,
    ...normalizeForm(form),
  };
}

export function normalizeForm(form: PatientFormData): PatientFormData {
  return {
    ...form,
    fullName: form.fullName.trim(),
    department: form.department.trim(),
    diagnosis_tr: form.diagnosis_tr.trim(),
    diagnosis_en: form.diagnosis_en.trim(),
    note_tr: form.note_tr.trim(),
    note_en: form.note_en.trim(),
    score: Number(form.score),
    tags: form.tags.map((tag) => tag.trim()).filter(Boolean),
    notes: form.notes?.trim() || null,
  };
}

export function validatePatient(
  form: PatientFormData,
  messages: { required: string; scoreRange: string },
) {
  const errors: Partial<Record<keyof PatientFormData, string>> = {};

  if (!form.fullName.trim()) errors.fullName = messages.required;
  if (!form.birthDate) errors.birthDate = messages.required;
  if (!form.appointmentDate) errors.appointmentDate = messages.required;
  if (!form.department.trim()) errors.department = messages.required;
  if (!form.diagnosis_tr.trim()) errors.diagnosis_tr = messages.required;
  if (!form.diagnosis_en.trim()) errors.diagnosis_en = messages.required;
  if (!form.note_tr.trim()) errors.note_tr = messages.required;
  if (!form.note_en.trim()) errors.note_en = messages.required;
  if (Number(form.score) < 1 || Number(form.score) > 5) {
    errors.score = messages.scoreRange;
  }

  return errors;
}

export function formatDate(value: string, language: Language) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function toDateInput(value: string) {
  return value.slice(0, 10);
}

export function getPatientNote(patient: PatientRecord, language: Language) {
  return language === 'tr' ? patient.note_tr : patient.note_en;
}

export function getPatientDiagnosis(patient: PatientRecord, language: Language) {
  return language === 'tr' ? patient.diagnosis_tr : patient.diagnosis_en;
}

export function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR'))
    .join('');
}

export function filterAndSortPatients({
  patients,
  search,
  department,
  status,
  sortKey,
  language,
}: {
  patients: PatientRecord[];
  search: string;
  department: string;
  status: string;
  sortKey: SortKey;
  language: Language;
}) {
  const query = search.trim().toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US');

  return patients
    .filter((patient) => {
      const matchesDepartment = department === 'all' || patient.department === department;
      const matchesStatus = status === 'all' || patient.status === status;
      const searchable = [
        patient.fullName,
        patient.department,
        patient.status,
        patient.priority,
        patient.bloodType,
        patient.diagnosis_tr,
        patient.diagnosis_en,
        patient.note_tr,
        patient.note_en,
        patient.notes ?? '',
        ...patient.tags,
      ]
        .join(' ')
        .toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US');

      return matchesDepartment && matchesStatus && searchable.includes(query);
    })
    .sort((a, b) => {
      if (sortKey === 'fullName') {
        return a.fullName.localeCompare(b.fullName, language === 'tr' ? 'tr' : 'en');
      }

      if (sortKey === 'score') {
        return b.score - a.score;
      }

      return new Date(a[sortKey]).getTime() - new Date(b[sortKey]).getTime();
    });
}
