import { formatCurrency } from "./calc";

export type EmployeeRecord = {
  id: string;
  serialNumber: string;
  name: string;
  employeeId: string;
  project: string;
  nationality: string;
  role: string;
  actionType: "نهاية خدمة" | "صرف إجازة" | "مستحقات أخرى";
  amount: number;
  actionDate: string;
  notes: string;
};

const STORAGE_KEY = "hr_records_v1";

function generateSerial(baseIndex: number) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const seq = (baseIndex + 1).toString().padStart(3, "0");
  return `REC-${datePart}-${seq}`;
}

export function loadRecords(): EmployeeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed: Partial<EmployeeRecord>[] = stored ? JSON.parse(stored) : [];
    return parsed.map((r, idx) => ({
      id: r.id ?? crypto.randomUUID(),
      serialNumber: r.serialNumber ?? generateSerial(idx),
      name: r.name ?? "",
      employeeId: r.employeeId ?? "",
      project: r.project ?? "",
      nationality: r.nationality ?? "",
      role: r.role ?? "",
      actionType: (r.actionType as EmployeeRecord["actionType"]) ?? "مستحقات أخرى",
      amount: r.amount ?? 0,
      actionDate: r.actionDate ?? new Date().toISOString().split("T")[0],
      notes: r.notes ?? "",
    }));
  } catch (e) {
    console.error("Failed to load records", e);
    return [];
  }
}

export function saveRecords(records: EmployeeRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function appendRecord(
  partial: Partial<EmployeeRecord> & {
    actionType: EmployeeRecord["actionType"];
    amount: number;
  }
): { records: EmployeeRecord[]; newRecord: EmployeeRecord } {
  const records = loadRecords();
  const today = new Date().toISOString().split("T")[0];
  const serialNumber = generateSerial(records.length);
  const newItem: EmployeeRecord = {
    id: crypto.randomUUID(),
    serialNumber,
    name: partial.name ?? "",
    employeeId: partial.employeeId ?? "",
    project: partial.project ?? "",
    nationality: partial.nationality ?? "",
    role: partial.role ?? "",
    actionType: partial.actionType,
    amount: partial.amount ?? 0,
    actionDate: partial.actionDate ?? today,
    notes: partial.notes ?? "",
  };
  const next = [newItem, ...records];
  saveRecords(next);
  return { records: next, newRecord: newItem };
}

export function summarizeRecord(record: EmployeeRecord) {
  return `${record.actionDate} - ${record.name} (${record.employeeId}) - ${record.actionType} - ${formatCurrency(record.amount)}`;
}

