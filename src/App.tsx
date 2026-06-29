import {
  Activity,
  CalendarDays,
  Check,
  ChevronsUpDown,
  CircleAlert,
  ClipboardPlus,
  Edit3,
  Languages,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRoundPlus,
  X,
} from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { fetchPatients } from './patientApi';
import {
  bloodTypes,
  createEmptyForm,
  fallbackDepartments,
  filterAndSortPatients,
  formatDate,
  formFromPatient,
  getInitials,
  getPatientDiagnosis,
  getPatientNote,
  makePatient,
  priorities,
  statuses,
  updatePatient,
  validatePatient,
} from './patientUtils';
import {
  departmentLabels,
  priorityLabels,
  sortLabels,
  statusLabels,
  translations,
} from './i18n';
import type { Language, PatientFormData, PatientRecord, SortKey } from './types';

const sortKeys: SortKey[] = ['appointmentDate', 'createdAt', 'fullName', 'score'];

export function App() {
  const [language, setLanguage] = useState<Language>('tr');
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('appointmentDate');
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const t = translations[language];

  async function loadPatients() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPatients();
      setPatients(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPatients();
  }, []);

  const departments = useMemo(() => {
    const apiDepartments = patients.map((patient) => patient.department);
    return Array.from(new Set([...fallbackDepartments, ...apiDepartments])).sort((a, b) =>
      a.localeCompare(b, 'tr'),
    );
  }, [patients]);

  const visiblePatients = useMemo(
    () =>
      filterAndSortPatients({
        patients,
        search,
        department,
        status,
        sortKey,
        language,
      }),
    [patients, search, department, status, sortKey, language],
  );

  const stats = useMemo(
    () => ({
      total: patients.length,
      urgent: patients.filter((patient) => patient.priority === 'acil').length,
      waiting: patients.filter((patient) => patient.status === 'Bekliyor').length,
      followUp: patients.filter((patient) => patient.isFollowUp).length,
    }),
    [patients],
  );

  function openCreateForm() {
    setEditingPatient(null);
    setIsFormOpen(true);
  }

  function openEditForm(patient: PatientRecord) {
    setEditingPatient(patient);
    setIsFormOpen(true);
  }

  function handleDelete(patient: PatientRecord) {
    if (window.confirm(t.deleteConfirm)) {
      setPatients((current) => current.filter((item) => item.id !== patient.id));
    }
  }

  function handleSubmit(form: PatientFormData) {
    setPatients((current) => {
      if (!editingPatient) {
        return [makePatient(form), ...current];
      }

      return current.map((patient) =>
        patient.id === editingPatient.id ? updatePatient(patient, form) : patient,
      );
    });
    setIsFormOpen(false);
    setEditingPatient(null);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{t.brand}</p>
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
        <div className="topbar-actions">
          <button
            className="icon-text-button secondary"
            type="button"
            onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
            aria-label="Change language"
            title="TR / EN"
          >
            <Languages size={18} aria-hidden="true" />
            <span>{language.toLocaleUpperCase('en-US')}</span>
          </button>
          <button className="icon-text-button primary" type="button" onClick={openCreateForm}>
            <UserRoundPlus size={18} aria-hidden="true" />
            <span>{t.addPatient}</span>
          </button>
        </div>
      </header>

      <section className="summary-grid" aria-label="Summary">
        <Metric icon={<Activity size={18} />} label={t.totalPatients} value={stats.total} />
        <Metric icon={<CircleAlert size={18} />} label={t.urgentPatients} value={stats.urgent} />
        <Metric icon={<CalendarDays size={18} />} label={t.waitingPatients} value={stats.waiting} />
        <Metric icon={<ShieldCheck size={18} />} label={t.followUps} value={stats.followUp} />
      </section>

      <section className="controls" aria-label="Patient controls">
        <div className="search-control">
          <label htmlFor="patient-search">{t.search}</label>
          <div className="input-with-icon">
            <Search size={18} aria-hidden="true" />
            <input
              id="patient-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.searchPlaceholder}
            />
          </div>
        </div>

        <SelectControl
          id="department-filter"
          label={t.filterDepartment}
          value={department}
          onChange={setDepartment}
          options={[
            { value: 'all', label: t.allDepartments },
            ...departments.map((item) => ({
              value: item,
              label: departmentLabels[language][item] ?? item,
            })),
          ]}
        />

        <SelectControl
          id="status-filter"
          label={t.filterStatus}
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: t.allStatuses },
            ...statuses.map((item) => ({ value: item, label: statusLabels[language][item] })),
          ]}
        />

        <SelectControl
          id="sort-key"
          label={t.sortBy}
          value={sortKey}
          onChange={(value) => setSortKey(value as SortKey)}
          options={sortKeys.map((key) => ({ value: key, label: sortLabels[language][key] }))}
          icon={<ChevronsUpDown size={16} aria-hidden="true" />}
        />
      </section>

      <section className="table-panel">
        <div className="table-header">
          <div>
            <p className="section-label">{t.patients}</p>
          </div>
          <p className="local-note">{t.localOps}</p>
        </div>

        {isLoading ? (
          <LoadingState label={t.loading} />
        ) : error ? (
          <ErrorState title={t.errorTitle} error={error} retry={loadPatients} retryLabel={t.retry} />
        ) : visiblePatients.length === 0 ? (
          <EmptyState title={t.emptyTitle} body={t.emptyBody} />
        ) : (
          <PatientTable
            patients={visiblePatients}
            language={language}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
        )}
      </section>

      {isFormOpen && (
        <PatientFormModal
          language={language}
          departments={departments}
          initialValue={editingPatient ? formFromPatient(editingPatient) : createEmptyForm()}
          title={editingPatient ? t.editPatient : t.addPatient}
          onSubmit={handleSubmit}
          onClose={() => {
            setIsFormOpen(false);
            setEditingPatient(null);
          }}
        />
      )}
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="metric">
      <div className="metric-icon">{icon}</div>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function SelectControl({
  id,
  label,
  value,
  onChange,
  options,
  icon = <SlidersHorizontal size={16} aria-hidden="true" />,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: ReactNode;
}) {
  return (
    <div className="select-control">
      <label htmlFor={id}>{label}</label>
      <div className="select-shell">
        {icon}
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function PatientTable({
  patients,
  language,
  onEdit,
  onDelete,
}: {
  patients: PatientRecord[];
  language: Language;
  onEdit: (patient: PatientRecord) => void;
  onDelete: (patient: PatientRecord) => void;
}) {
  const t = translations[language];

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{t.patient}</th>
            <th>{t.appointment}</th>
            <th>{t.department}</th>
            <th>{t.status}</th>
            <th>{t.diagnosis}</th>
            <th>{t.flags}</th>
            <th>{t.actions}</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td>
                <div className="patient-cell">
                  <span className="avatar">{getInitials(patient.fullName)}</span>
                  <span>
                    <strong>{patient.fullName}</strong>
                    <small>
                      {patient.bloodType} · {t.score} {patient.score}
                    </small>
                  </span>
                </div>
              </td>
              <td>
                <span className="date-main">{formatDate(patient.appointmentDate, language)}</span>
                <small>
                  {t.created}: {formatDate(patient.createdAt, language)}
                </small>
              </td>
              <td>{departmentLabels[language][patient.department] ?? patient.department}</td>
              <td>
                <div className="stacked-badges">
                  <span className={`badge status-${statusClass(patient.status)}`}>
                    {statusLabels[language][patient.status]}
                  </span>
                  <span className={`badge priority-${patient.priority}`}>
                    {priorityLabels[language][patient.priority]}
                  </span>
                </div>
              </td>
              <td>
                <strong>{getPatientDiagnosis(patient, language)}</strong>
                <small>{getPatientNote(patient, language)}</small>
                <div className="tags">
                  {patient.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </td>
              <td>
                <div className="flag-list">
                  {patient.isInsured && <span>{t.insured}</span>}
                  {patient.isFollowUp && <span>{t.followUp}</span>}
                  {patient.isVaccinated && <span>{t.vaccinated}</span>}
                </div>
              </td>
              <td>
                <div className="row-actions">
                  <button type="button" onClick={() => onEdit(patient)} title={t.edit} aria-label={t.edit}>
                    <Edit3 size={17} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => onDelete(patient)}
                    title={t.delete}
                    aria-label={t.delete}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PatientFormModal({
  language,
  departments,
  initialValue,
  title,
  onSubmit,
  onClose,
}: {
  language: Language;
  departments: string[];
  initialValue: PatientFormData;
  title: string;
  onSubmit: (form: PatientFormData) => void;
  onClose: () => void;
}) {
  const t = translations[language];
  const [form, setForm] = useState<PatientFormData>(initialValue);
  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormData, string>>>({});

  function setField<Key extends keyof PatientFormData>(key: Key, value: PatientFormData[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validatePatient(form, {
      required: t.required,
      scoreRange: t.scoreRange,
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(form);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="patient-form-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{t.brand}</p>
            <h2 id="patient-form-title">{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t.close}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={submitForm} className="patient-form">
          <TextField
            label={t.formName}
            value={form.fullName}
            onChange={(value) => setField('fullName', value)}
            error={errors.fullName}
          />

          <div className="form-grid">
            <TextField
              label={t.formBirthDate}
              type="date"
              value={form.birthDate}
              onChange={(value) => setField('birthDate', value)}
              error={errors.birthDate}
            />
            <TextField
              label={t.formAppointment}
              type="date"
              value={form.appointmentDate}
              onChange={(value) => setField('appointmentDate', value)}
              error={errors.appointmentDate}
            />
          </div>

          <div className="form-grid three">
            <SelectField
              label={t.formDepartment}
              value={form.department}
              onChange={(value) => setField('department', value)}
              options={departments.map((item) => ({
                value: item,
                label: departmentLabels[language][item] ?? item,
              }))}
            />
            <SelectField
              label={t.formStatus}
              value={form.status}
              onChange={(value) => setField('status', value as PatientFormData['status'])}
              options={statuses.map((item) => ({ value: item, label: statusLabels[language][item] }))}
            />
            <SelectField
              label={t.formPriority}
              value={form.priority}
              onChange={(value) => setField('priority', value as PatientFormData['priority'])}
              options={priorities.map((item) => ({
                value: item,
                label: priorityLabels[language][item],
              }))}
            />
          </div>

          <div className="form-grid three">
            <SelectField
              label={t.formBlood}
              value={form.bloodType}
              onChange={(value) => setField('bloodType', value)}
              options={bloodTypes.map((item) => ({ value: item, label: item }))}
            />
            <TextField
              label={t.formScore}
              type="number"
              min="1"
              max="5"
              value={String(form.score)}
              onChange={(value) => setField('score', Number(value))}
              error={errors.score}
            />
            <TextField
              label={t.formTags}
              value={form.tags.join(', ')}
              helper={t.formTagsHelp}
              onChange={(value) => setField('tags', value.split(','))}
            />
          </div>

          <div className="form-grid">
            <TextField
              label={t.formDiagnosisTr}
              value={form.diagnosis_tr}
              onChange={(value) => setField('diagnosis_tr', value)}
              error={errors.diagnosis_tr}
            />
            <TextField
              label={t.formDiagnosisEn}
              value={form.diagnosis_en}
              onChange={(value) => setField('diagnosis_en', value)}
              error={errors.diagnosis_en}
            />
          </div>

          <div className="form-grid">
            <TextAreaField
              label={t.formNoteTr}
              value={form.note_tr}
              onChange={(value) => setField('note_tr', value)}
              error={errors.note_tr}
            />
            <TextAreaField
              label={t.formNoteEn}
              value={form.note_en}
              onChange={(value) => setField('note_en', value)}
              error={errors.note_en}
            />
          </div>

          <TextAreaField
            label={t.formExtraNotes}
            value={form.notes ?? ''}
            onChange={(value) => setField('notes', value)}
          />

          <div className="toggle-row">
            <ToggleField
              label={t.insured}
              checked={form.isInsured}
              onChange={(checked) => setField('isInsured', checked)}
            />
            <ToggleField
              label={t.followUp}
              checked={form.isFollowUp}
              onChange={(checked) => setField('isFollowUp', checked)}
            />
            <ToggleField
              label={t.vaccinated}
              checked={form.isVaccinated}
              onChange={(checked) => setField('isVaccinated', checked)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="icon-text-button secondary" onClick={onClose}>
              <X size={17} aria-hidden="true" />
              <span>{t.cancel}</span>
            </button>
            <button type="submit" className="icon-text-button primary">
              <Check size={17} aria-hidden="true" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  helper,
  error,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  helper?: string;
  error?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
      />
      {helper && <small>{helper}</small>}
      {error && <strong>{error}</strong>}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <strong>{error}</strong>}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-field">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="state-block" aria-live="polite">
      <p>{label}</p>
      <div className="skeleton-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    </div>
  );
}

function ErrorState({
  title,
  error,
  retry,
  retryLabel,
}: {
  title: string;
  error: string;
  retry: () => void;
  retryLabel: string;
}) {
  return (
    <div className="state-block">
      <CircleAlert size={24} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{error}</p>
      <button type="button" className="icon-text-button secondary" onClick={retry}>
        <RefreshCw size={17} aria-hidden="true" />
        <span>{retryLabel}</span>
      </button>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="state-block">
      <ClipboardPlus size={26} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

function statusClass(status: PatientRecord['status']) {
  if (status === 'Bekliyor') return 'waiting';
  if (status === 'Muayenede') return 'exam';
  if (status === 'Tamamlandı') return 'done';
  return 'cancelled';
}
