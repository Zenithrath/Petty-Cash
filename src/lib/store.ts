import { useSyncExternalStore } from "react";
import { createClient } from "@/utils/supabase/client";
import type {
  Attachment,
  CashInflow,
  CashOutflow,
  Denomination,
  Employee,
  InflowDetail,
  KategoriUtama,
  LedgerData,
  OutflowDetail,
  SubKategori,
  User,
  UserRole,
} from "@/types";

export const DENOMINATIONS: Denomination[] = [
  { id: "d-100k", value: 100000, type: "lembar", isActive: true },
  { id: "d-50k", value: 50000, type: "lembar", isActive: true },
  { id: "d-20k", value: 20000, type: "lembar", isActive: true },
  { id: "d-10k", value: 10000, type: "lembar", isActive: true },
  { id: "d-5k", value: 5000, type: "lembar", isActive: true },
  { id: "d-2k", value: 2000, type: "lembar", isActive: true },
  { id: "d-1k", value: 1000, type: "lembar", isActive: true },
  { id: "k-1k", value: 1000, type: "koin", isActive: true },
  { id: "k-500", value: 500, type: "koin", isActive: true },
  { id: "k-200", value: 200, type: "koin", isActive: true },
  { id: "k-100", value: 100, type: "koin", isActive: true },
];

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;

export interface DbState {
  hydrated: boolean;
  currentUserId: string | null;
  users: User[];
  employees: Employee[];
  kategoriUtama: KategoriUtama[];
  subKategori: SubKategori[];
  inflows: CashInflow[];
  inflowDetails: InflowDetail[];
  outflows: CashOutflow[];
  outflowDetails: OutflowDetail[];
  kasFisikOverrides: Record<string, { quantity: number; updatedAt: string }>;
}

const emptyState = (): DbState => ({
  hydrated: false,
  currentUserId: null,
  users: [],
  employees: [],
  kategoriUtama: [],
  subKategori: [],
  inflows: [],
  inflowDetails: [],
  outflows: [],
  outflowDetails: [],
  kasFisikOverrides: {},
});

let state: DbState = emptyState();

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setState(next: DbState) {
  state = next;
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState(): DbState {
  return state;
}

export function useStore<T>(selector: (s: DbState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

// ---------- Mapping baris database -> tipe aplikasi ----------

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  approved_at: string | null;
  created_at: string;
}

interface EmployeeRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface KategoriUtamaRow {
  id: string;
  name: string;
  created_at: string;
}

interface SubKategoriRow {
  id: string;
  kategori_utama_id: string;
  code: number;
  name: string;
  created_at: string;
}

interface InflowDetailRow {
  id: string;
  inflow_id: string;
  denomination_id: string;
  quantity: number;
}

interface OutflowDetailRow {
  id: string;
  outflow_id: string;
  denomination_id: string;
  quantity: number;
}

interface InflowRow {
  id: string;
  date: string;
  description: string;
  receipt_no: string;
  kategori_utama_id: string;
  sub_kategori_id: string;
  employee_id: string;
  amount: number;
  attachments: Attachment[] | null;
  created_by: string;
  created_at: string;
}

interface OutflowRow {
  id: string;
  date: string;
  description: string;
  receipt_no: string;
  kategori_utama_id: string;
  sub_kategori_id: string;
  employee_id: string;
  amount_out: number;
  attachments: Attachment[] | null;
  created_by: string;
  created_at: string;
}

function mapProfile(r: ProfileRow): User {
  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    role: r.role,
    isActive: r.is_active,
    approvedAt: r.approved_at,
    createdAt: r.created_at,
  };
}

function mapEmployee(r: EmployeeRow): Employee {
  return {
    id: r.id,
    name: r.name,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapKategoriUtama(r: KategoriUtamaRow): KategoriUtama {
  return {
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
  };
}

function mapSubKategori(r: SubKategoriRow): SubKategori {
  return {
    id: r.id,
    kategoriUtamaId: r.kategori_utama_id,
    code: r.code,
    name: r.name,
    createdAt: r.created_at,
  };
}

function mapInflowDetail(r: InflowDetailRow): InflowDetail {
  return {
    id: r.id,
    inflowId: r.inflow_id,
    denominationId: r.denomination_id,
    quantity: r.quantity,
  };
}

function mapOutflowDetail(r: OutflowDetailRow): OutflowDetail {
  return {
    id: r.id,
    outflowId: r.outflow_id,
    denominationId: r.denomination_id,
    quantity: r.quantity,
  };
}

function mapInflow(r: InflowRow): CashInflow {
  return {
    id: r.id,
    date: r.date,
    description: r.description,
    receiptNo: r.receipt_no,
    kategoriUtamaId: r.kategori_utama_id,
    subKategoriId: r.sub_kategori_id,
    employeeId: r.employee_id,
    amount: Number(r.amount),
    attachments: r.attachments ?? [],
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

function mapOutflow(r: OutflowRow): CashOutflow {
  return {
    id: r.id,
    date: r.date,
    description: r.description,
    receiptNo: r.receipt_no,
    kategoriUtamaId: r.kategori_utama_id,
    subKategoriId: r.sub_kategori_id,
    employeeId: r.employee_id,
    amountOut: Number(r.amount_out),
    attachments: r.attachments ?? [],
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

// ---------- Auth ----------

export interface AuthResult {
  ok: boolean;
  error?: string;
}

function authErrorText(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email atau password salah";
  if (m.includes("email not confirmed")) return "Email belum dikonfirmasi — cek kotak masuk Anda";
  if (m.includes("already registered")) return "Email sudah terdaftar";
  if (m.includes("weak password")) return "Password terlalu lemah (minimal 6 karakter)";
  return message;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, error: authErrorText(error?.message ?? "Gagal masuk") };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();
  if (profileError || !profile) {
    await supabase.auth.signOut();
    return { ok: false, error: "Akun tidak ditemukan di daftar pengguna" };
  }

  const mapped = mapProfile(profile as unknown as ProfileRow);
  if (!mapped.isActive) {
    await supabase.auth.signOut();
    return { ok: false, error: "Akun belum disetujui superadmin" };
  }

  setState({
    ...state,
    currentUserId: mapped.id,
    users: upsertById(state.users, mapped),
  });
  return { ok: true };
}

export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: { data: { full_name: input.fullName.trim() } },
  });
  if (error) return { ok: false, error: authErrorText(error.message) };
  if (data.session) {
    // Email confirmation dimatikan: keluarkan dulu, akun menunggu persetujuan.
    await supabase.auth.signOut();
  }
  return { ok: true };
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  setState({ ...state, currentUserId: null });
}

// ---------- Hydrasi data awal ----------

export async function hydrate() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  if (!currentUserId) {
    setState({ ...emptyState(), hydrated: true });
    return;
  }

  const [
    profilesRes,
    employeesRes,
    kuRes,
    subRes,
    inRes,
    inDetRes,
    outRes,
    outDetRes,
    kasRes,
  ] = await Promise.allSettled([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase.from("employees").select("*").order("created_at", { ascending: true }),
    supabase.from("kategori_utama").select("*").order("created_at", { ascending: true }),
    supabase.from("sub_kategori").select("*").order("code", { ascending: true }),
    supabase.from("inflows").select("*").order("date", { ascending: true }),
    supabase.from("inflow_details").select("*"),
    supabase.from("outflows").select("*").order("date", { ascending: true }),
    supabase.from("outflow_details").select("*"),
    supabase.from("kas_fisik").select("*"),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  function pickData(res: PromiseSettledResult<{ data: any[] | null }>): any[] {
    if (res.status === "rejected") return [];
    return res.value?.data ?? [];
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const profilesData = pickData(profilesRes);
  const employeesData = pickData(employeesRes);
  const kuData = pickData(kuRes);
  const subData = pickData(subRes);
  const inData = pickData(inRes);
  const inDetData = pickData(inDetRes);
  const outData = pickData(outRes);
  const outDetData = pickData(outDetRes);
  const kasData = pickData(kasRes);

  const kasFisikOverrides: DbState["kasFisikOverrides"] = {};
  for (const row of kasData) {
    kasFisikOverrides[row.denomination_id] = {
      quantity: row.quantity,
      updatedAt: row.updated_at,
    };
  }

  setState({
    hydrated: true,
    currentUserId,
    users: profilesData.map(mapProfile),
    employees: employeesData.map(mapEmployee),
    kategoriUtama: kuData.map(mapKategoriUtama),
    subKategori: subData.map(mapSubKategori),
    inflows: inData.map(mapInflow),
    inflowDetails: inDetData.map(mapInflowDetail),
    outflows: outData.map(mapOutflow),
    outflowDetails: outDetData.map(mapOutflowDetail),
    kasFisikOverrides,
  });
}

// ---------- Helpers ----------

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...list, item];
  const next = [...list];
  next[idx] = item;
  return next;
}

export function trxCodeOfSub(s: DbState, subKategoriId: string): string {
  const sub = s.subKategori.find((sk) => sk.id === subKategoriId);
  return sub ? String(sub.code).padStart(3, "0") : "";
}

export function isSubKeluar(sub: SubKategori | undefined): boolean {
  return !!sub && sub.code < 200;
}

// ---------- User management (superadmin) ----------

export async function approveUser(userId: string): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: true, approved_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  setState({
    ...state,
    users: state.users.map((u) =>
      u.id === userId ? { ...u, isActive: true, approvedAt: new Date().toISOString() } : u
    ),
  });
  return { ok: true };
}

export async function rejectUser(userId: string): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) return { ok: false, error: error.message };
  setState({ ...state, users: state.users.filter((u) => u.id !== userId) });
  return { ok: true };
}

export async function setUserRole(userId: string, role: User["role"]): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  setState({
    ...state,
    users: state.users.map((u) => (u.id === userId ? { ...u, role } : u)),
  });
  return { ok: true };
}

export async function toggleUserActive(userId: string): Promise<AuthResult> {
  const supabase = createClient();
  const target = state.users.find((u) => u.id === userId);
  if (!target) return { ok: false, error: "Akun tidak ditemukan" };
  const nextActive = !target.isActive;
  const { error } = await supabase
    .from("profiles")
    .update({
      is_active: nextActive,
      approved_at: nextActive ? new Date().toISOString() : target.approvedAt,
    })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  setState({
    ...state,
    users: state.users.map((u) =>
      u.id === userId ? { ...u, isActive: nextActive, approvedAt: nextActive ? new Date().toISOString() : u.approvedAt } : u
    ),
  });
  return { ok: true };
}

// ---------- Anggota ----------

export async function addEmployee(name: string): Promise<AuthResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nama anggota wajib diisi" };
  if (state.employees.some((e) => e.name.toLowerCase() === trimmed.toLowerCase())) {
    return { ok: false, error: "Anggota sudah terdaftar" };
  }
  const supabase = createClient();
  const employee: Employee = {
    id: uid("e"),
    name: trimmed,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  const { error } = await supabase.from("employees").insert({
    id: employee.id,
    name: employee.name,
    is_active: employee.isActive,
    created_at: employee.createdAt,
  });
  if (error) return { ok: false, error: error.message };
  setState({ ...state, employees: [...state.employees, employee] });
  return { ok: true };
}

export async function updateEmployee(employeeId: string, name: string): Promise<AuthResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nama anggota wajib diisi" };
  if (
    state.employees.some(
      (e) => e.id !== employeeId && e.name.toLowerCase() === trimmed.toLowerCase()
    )
  ) {
    return { ok: false, error: "Anggota sudah terdaftar" };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("employees")
    .update({ name: trimmed })
    .eq("id", employeeId);
  if (error) return { ok: false, error: error.message };
  setState({
    ...state,
    employees: state.employees.map((e) =>
      e.id === employeeId ? { ...e, name: trimmed } : e
    ),
  });
  return { ok: true };
}

export async function deleteEmployee(employeeId: string): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase.from("employees").delete().eq("id", employeeId);
  if (error) return { ok: false, error: error.message };
  setState({ ...state, employees: state.employees.filter((e) => e.id !== employeeId) });
  return { ok: true };
}

// ---------- Kategori Utama ----------

export async function addKategoriUtama(name: string): Promise<AuthResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nama kategori utama wajib diisi" };
  if (state.kategoriUtama.some((k) => k.name.toLowerCase() === trimmed.toLowerCase())) {
    return { ok: false, error: "Kategori utama sudah ada" };
  }
  const supabase = createClient();
  const ku: KategoriUtama = { id: uid("ku"), name: trimmed, createdAt: new Date().toISOString() };
  const { error } = await supabase.from("kategori_utama").insert({
    id: ku.id,
    name: ku.name,
    created_at: ku.createdAt,
  });
  if (error) return { ok: false, error: error.message };
  setState({ ...state, kategoriUtama: [...state.kategoriUtama, ku] });
  return { ok: true };
}

export async function updateKategoriUtama(id: string, name: string): Promise<AuthResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nama kategori utama wajib diisi" };
  if (state.kategoriUtama.some((k) => k.id !== id && k.name.toLowerCase() === trimmed.toLowerCase())) {
    return { ok: false, error: "Kategori utama sudah ada" };
  }
  const supabase = createClient();
  const { error } = await supabase.from("kategori_utama").update({ name: trimmed }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  setState({
    ...state,
    kategoriUtama: state.kategoriUtama.map((k) => (k.id === id ? { ...k, name: trimmed } : k)),
  });
  return { ok: true };
}

export async function deleteKategoriUtama(id: string): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase.from("kategori_utama").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  setState({
    ...state,
    kategoriUtama: state.kategoriUtama.filter((k) => k.id !== id),
    subKategori: state.subKategori.filter((s) => s.kategoriUtamaId !== id),
  });
  return { ok: true };
}

// ---------- Sub Kategori ----------

export async function addSubKategori(
  kategoriUtamaId: string,
  code: number,
  name: string
): Promise<AuthResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nama sub kategori wajib diisi" };
  if (!state.kategoriUtama.some((k) => k.id === kategoriUtamaId)) {
    return { ok: false, error: "Kategori utama tidak valid" };
  }
  if (state.subKategori.some((s) => s.code === code)) {
    return { ok: false, error: `Kode ${String(code).padStart(3, "0")} sudah dipakai` };
  }
  if (
    state.subKategori.some(
      (s) => s.kategoriUtamaId === kategoriUtamaId && s.name.toLowerCase() === trimmed.toLowerCase()
    )
  ) {
    return { ok: false, error: "Sub kategori sudah ada di kategori ini" };
  }
  const supabase = createClient();
  const sub: SubKategori = {
    id: uid("c"),
    kategoriUtamaId,
    code,
    name: trimmed,
    createdAt: new Date().toISOString(),
  };
  const { error } = await supabase.from("sub_kategori").insert({
    id: sub.id,
    kategori_utama_id: sub.kategoriUtamaId,
    code: sub.code,
    name: sub.name,
    created_at: sub.createdAt,
  });
  if (error) return { ok: false, error: error.message };
  setState({ ...state, subKategori: [...state.subKategori, sub] });
  return { ok: true };
}

export async function updateSubKategori(
  id: string,
  code: number,
  name: string
): Promise<AuthResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Nama sub kategori wajib diisi" };
  const target = state.subKategori.find((s) => s.id === id);
  if (!target) return { ok: false, error: "Sub kategori tidak ditemukan" };
  if (state.subKategori.some((s) => s.id !== id && s.code === code)) {
    return { ok: false, error: `Kode ${String(code).padStart(3, "0")} sudah dipakai` };
  }
  if (
    state.subKategori.some(
      (s) =>
        s.id !== id &&
        s.kategoriUtamaId === target.kategoriUtamaId &&
        s.name.toLowerCase() === trimmed.toLowerCase()
    )
  ) {
    return { ok: false, error: "Sub kategori sudah ada di kategori ini" };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("sub_kategori")
    .update({ code, name: trimmed })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  setState({
    ...state,
    subKategori: state.subKategori.map((s) => (s.id === id ? { ...s, code, name: trimmed } : s)),
  });
  return { ok: true };
}

export async function deleteSubKategori(id: string): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase.from("sub_kategori").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  setState({ ...state, subKategori: state.subKategori.filter((s) => s.id !== id) });
  return { ok: true };
}

// ---------- Pemasukan ----------

export async function addInflow(input: {
  date: string;
  description: string;
  receiptNo: string;
  kategoriUtamaId: string;
  subKategoriId: string;
  employeeId: string;
  amount: number;
  stocks: { denominationId: string; quantity: number }[];
  attachments: Attachment[];
}): Promise<AuthResult> {
  const supabase = createClient();
  const inflow: CashInflow = {
    id: uid("in"),
    date: input.date,
    description: input.description.trim(),
    receiptNo: input.receiptNo.trim(),
    kategoriUtamaId: input.kategoriUtamaId,
    subKategoriId: input.subKategoriId,
    employeeId: input.employeeId,
    amount: input.amount,
    attachments: input.attachments,
    createdBy: state.currentUserId ?? "",
    createdAt: new Date().toISOString(),
  };
  const details: InflowDetail[] = input.stocks
    .filter((s) => s.quantity > 0)
    .map((s) => ({
      id: uid("id"),
      inflowId: inflow.id,
      denominationId: s.denominationId,
      quantity: s.quantity,
    }));

  const { error } = await supabase.from("inflows").insert({
    id: inflow.id,
    date: inflow.date,
    description: inflow.description,
    receipt_no: inflow.receiptNo,
    kategori_utama_id: inflow.kategoriUtamaId,
    sub_kategori_id: inflow.subKategoriId,
    employee_id: inflow.employeeId,
    amount: inflow.amount,
    attachments: inflow.attachments,
    created_by: inflow.createdBy,
    created_at: inflow.createdAt,
  });
  if (error) return { ok: false, error: error.message };
  if (details.length > 0) {
    const { error: detailsError } = await supabase.from("inflow_details").insert(
      details.map((d) => ({
        id: d.id,
        inflow_id: d.inflowId,
        denomination_id: d.denominationId,
        quantity: d.quantity,
      }))
    );
    if (detailsError) return { ok: false, error: detailsError.message };
  }
  setState({
    ...state,
    inflows: [...state.inflows, inflow],
    inflowDetails: [...state.inflowDetails, ...details],
  });
  return { ok: true };
}

// ---------- Pengeluaran ----------

export async function addOutflow(input: {
  date: string;
  description: string;
  receiptNo: string;
  kategoriUtamaId: string;
  subKategoriId: string;
  employeeId: string;
  amountOut: number;
  outStocks: { denominationId: string; quantity: number }[];
  attachments: Attachment[];
}): Promise<AuthResult> {
  const supabase = createClient();
  const outflow: CashOutflow = {
    id: uid("ou"),
    date: input.date,
    description: input.description.trim(),
    receiptNo: input.receiptNo.trim(),
    kategoriUtamaId: input.kategoriUtamaId,
    subKategoriId: input.subKategoriId,
    employeeId: input.employeeId,
    amountOut: input.amountOut,
    attachments: input.attachments,
    createdBy: state.currentUserId ?? "",
    createdAt: new Date().toISOString(),
  };
  const details: OutflowDetail[] = input.outStocks
    .filter((s) => s.quantity > 0)
    .map((s) => ({
      id: uid("od"),
      outflowId: outflow.id,
      denominationId: s.denominationId,
      quantity: s.quantity,
    }));

  const { error } = await supabase.from("outflows").insert({
    id: outflow.id,
    date: outflow.date,
    description: outflow.description,
    receipt_no: outflow.receiptNo,
    kategori_utama_id: outflow.kategoriUtamaId,
    sub_kategori_id: outflow.subKategoriId,
    employee_id: outflow.employeeId,
    amount_out: outflow.amountOut,
    attachments: outflow.attachments,
    created_by: outflow.createdBy,
    created_at: outflow.createdAt,
  });
  if (error) return { ok: false, error: error.message };
  if (details.length > 0) {
    const { error: detailsError } = await supabase.from("outflow_details").insert(
      details.map((d) => ({
        id: d.id,
        outflow_id: d.outflowId,
        denomination_id: d.denominationId,
        quantity: d.quantity,
      }))
    );
    if (detailsError) return { ok: false, error: detailsError.message };
  }
  setState({
    ...state,
    outflows: [...state.outflows, outflow],
    outflowDetails: [...state.outflowDetails, ...details],
  });
  return { ok: true };
}

// ---------- Evidence ----------

export async function updateInflowEvidence(
  inflowId: string,
  attachment: Attachment | null
): Promise<AuthResult> {
  const supabase = createClient();
  const attachments = attachment ? [attachment] : [];
  const { error } = await supabase
    .from("inflows")
    .update({ attachments })
    .eq("id", inflowId);
  if (error) return { ok: false, error: error.message };
  setState({
    ...state,
    inflows: state.inflows.map((i) =>
      i.id === inflowId ? { ...i, attachments } : i
    ),
  });
  return { ok: true };
}

export async function updateOutflowEvidence(
  outflowId: string,
  attachment: Attachment | null
): Promise<AuthResult> {
  const supabase = createClient();
  const attachments = attachment ? [attachment] : [];
  const { error } = await supabase
    .from("outflows")
    .update({ attachments })
    .eq("id", outflowId);
  if (error) return { ok: false, error: error.message };
  setState({
    ...state,
    outflows: state.outflows.map((o) =>
      o.id === outflowId ? { ...o, attachments } : o
    ),
  });
  return { ok: true };
}

// ---------- Attachment / Storage ----------

export async function uploadAttachment(
  file: File
): Promise<{ ok: boolean; attachment?: Attachment; error?: string }> {
  const supabase = createClient();
  const id = `att-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
  const filePath = `${id}/${safeName}`;
  const { error } = await supabase.storage
    .from("bukti")
    .upload(filePath, file, { contentType: file.type });
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    attachment: {
      id,
      name: file.name,
      type: file.type,
      size: file.size,
      filePath,
    },
  };
}

export async function deleteAttachmentFile(filePath: string | undefined): Promise<void> {
  if (!filePath) return;
  const supabase = createClient();
  await supabase.storage.from("bukti").remove([filePath]);
}

export function getAttachmentUrl(attachment: Attachment): string {
  if (attachment.filePath) {
    return createClient().storage.from("bukti").getPublicUrl(attachment.filePath).data.publicUrl;
  }
  return attachment.dataUrl ?? "";
}

// ---------- Kas Fisik ----------

export async function updateKasFisik(overrides: Record<string, number>): Promise<AuthResult> {
  const supabase = createClient();
  const updatedAt = new Date().toISOString();
  const rows = Object.entries(overrides).map(([denomination_id, quantity]) => ({
    id: denomination_id,
    denomination_id,
    quantity,
    updated_at: updatedAt,
    updated_by: state.currentUserId,
  }));
  const { error } = await supabase
    .from("kas_fisik")
    .upsert(rows, { onConflict: "denomination_id" });
  if (error) return { ok: false, error: error.message };
  const next: DbState["kasFisikOverrides"] = {};
  for (const [denomination_id, quantity] of Object.entries(overrides)) {
    next[denomination_id] = { quantity, updatedAt };
  }
  setState({ ...state, kasFisikOverrides: next });
  return { ok: true };
}

// ---------- Selectors ----------

export function getCurrentUser(s: DbState): User | null {
  return s.users.find((u) => u.id === s.currentUserId) ?? null;
}

export function getEmployee(s: DbState, employeeId: string): Employee | undefined {
  return s.employees.find((e) => e.id === employeeId);
}

export function getKategoriUtama(s: DbState, id: string): KategoriUtama | undefined {
  return s.kategoriUtama.find((k) => k.id === id);
}

export function getSubKategori(s: DbState, id: string): SubKategori | undefined {
  return s.subKategori.find((sk) => sk.id === id);
}

export function getSubKategoriByKategoriUtama(
  s: DbState,
  kategoriUtamaId: string,
  direction?: "keluar" | "masuk"
): SubKategori[] {
  let subs = s.subKategori.filter((sk) => sk.kategoriUtamaId === kategoriUtamaId);
  if (direction === "keluar") subs = subs.filter((sk) => sk.code < 200);
  if (direction === "masuk") subs = subs.filter((sk) => sk.code >= 200);
  return subs.sort((a, b) => a.code - b.code);
}

// ---------- Ledger ----------

export function getLedger(s: DbState): LedgerData {
  const entries: {
    kind: "in" | "out";
    amount: number;
    date: string;
    createdAt: string;
    inflow?: CashInflow;
    outflow?: CashOutflow;
  }[] = [
    ...s.inflows.map((i) => ({ kind: "in" as const, amount: i.amount, date: i.date, createdAt: i.createdAt, inflow: i })),
    ...s.outflows.map((o) => ({ kind: "out" as const, amount: o.amountOut, date: o.date, createdAt: o.createdAt, outflow: o })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  let saldo = 0;
  const rows = entries.map((e) => {
    saldo += e.kind === "in" ? e.amount : -e.amount;
    return { kind: e.kind, amount: e.amount, saldo, inflow: e.inflow, outflow: e.outflow };
  });

  const totalIn = s.inflows.reduce((sum, i) => sum + i.amount, 0);
  const totalOut = s.outflows.reduce((sum, o) => sum + o.amountOut, 0);

  return { rows, balance: saldo, totalIn, totalOut };
}

// ---------- Stock ----------

export function getStock(s: DbState): Map<string, number> {
  const map = new Map<string, number>();
  const inflowCreatedAt = new Map(s.inflows.map((i) => [i.id, i.createdAt] as const));
  const outflowCreatedAt = new Map(s.outflows.map((o) => [o.id, o.createdAt] as const));

  for (const [denomId, base] of Object.entries(s.kasFisikOverrides)) {
    map.set(denomId, base.quantity);
  }

  for (const detail of s.inflowDetails) {
    const base = s.kasFisikOverrides[detail.denominationId];
    const created = inflowCreatedAt.get(detail.inflowId);
    if (!base || (created && Date.parse(created) > Date.parse(base.updatedAt))) {
      map.set(detail.denominationId, (map.get(detail.denominationId) ?? 0) + detail.quantity);
    }
  }

  for (const detail of s.outflowDetails) {
    const base = s.kasFisikOverrides[detail.denominationId];
    const created = outflowCreatedAt.get(detail.outflowId);
    if (!base || (created && Date.parse(created) > Date.parse(base.updatedAt))) {
      map.set(detail.denominationId, Math.max(0, (map.get(detail.denominationId) ?? 0) - detail.quantity));
    }
  }

  return map;
}

export function getStockValue(s: DbState): number {
  const stock = getStock(s);
  let total = 0;
  for (const [denomId, qty] of stock) {
    total += (DENOMINATIONS.find((d) => d.id === denomId)?.value ?? 0) * qty;
  }
  return total;
}
