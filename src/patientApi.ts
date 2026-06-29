import type { PatientRecord } from './types';

const API_URL = 'https://v0-json-api-three.vercel.app/api/data';

export async function fetchPatients(): Promise<PatientRecord[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = (await response.json()) as PatientRecord[];
  return data.map((patient) => ({
    ...patient,
    notes: patient.notes ?? null,
    tags: Array.isArray(patient.tags) ? patient.tags : [],
  }));
}

export { API_URL };
