export type UserRole = "superadmin" | "admin";

export type DenominationType = "lembar" | "koin";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  approvedAt: string | null;
  createdAt: string;
}

export interface Denomination {
  id: string;
  value: number;
  type: DenominationType;
  isActive: boolean;
}

export interface KategoriUtama {
  id: string;
  name: string;
  createdAt: string;
}

export interface SubKategori {
  id: string;
  kategoriUtamaId: string;
  code: number;
  name: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface CashInflow {
  id: string;
  date: string;
  description: string;
  receiptNo: string;
  kategoriUtamaId: string;
  subKategoriId: string;
  employeeId: string;
  amount: number;
  attachments: Attachment[];
  createdBy: string;
  createdAt: string;
}

export interface InflowDetail {
  id: string;
  inflowId: string;
  denominationId: string;
  quantity: number;
}

export interface CashOutflow {
  id: string;
  date: string;
  description: string;
  receiptNo: string;
  kategoriUtamaId: string;
  subKategoriId: string;
  employeeId: string;
  amountOut: number;
  attachments: Attachment[];
  createdBy: string;
  createdAt: string;
}

export interface OutflowDetail {
  id: string;
  outflowId: string;
  denominationId: string;
  quantity: number;
}

export interface StockRow {
  denominationId: string;
  value: number;
  quantity: number;
}

export interface LedgerRow {
  kind: "in" | "out";
  amount: number;
  saldo: number;
  inflow?: CashInflow;
  outflow?: CashOutflow;
}

export interface LedgerData {
  rows: LedgerRow[];
  balance: number;
  totalIn: number;
  totalOut: number;
}
