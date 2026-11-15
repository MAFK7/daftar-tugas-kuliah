import './style.css';
import type { Tugas, Status, FilterType } from './types';
import { loadData, saveData } from './storage';

const appName: string = import.meta.env.VITE_APP_NAME;
const appVersion: string = import.meta.env.VITE_APP_VERSION;
const STORAGE_KEY = 'tugas-kuliah';

let daftarTugas: Tugas[] = loadData<Tugas[]>(STORAGE_KEY, []);
let editingId: number | null = null;
let filter: FilterType = 'Semua';

document.title = appName;

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="header">
    <h1>${appName}</h1>
    <span class="badge">v${appVersion}</span>
  </header>
  <main class="container">
    <form id="form" class="card">
      <h2 id="form-title">Tambah Tugas</h2>
      <input id="judul" placeholder="Judul tugas" required />
      <input id="matkul" placeholder="Mata kuliah" required />
      <input id="deadline" type="date" required />
      <div class="actions">
        <button type="submit" id="submit-btn">Tambah</button>
        <button type="button" id="cancel-btn" class="secondary hidden">Batal</button>
      </div>
    </form>
    <div class="filters">
      <button data-filter="Semua" class="active">Semua</button>
      <button data-filter="Belum Selesai">Belum Selesai</button>
      <button data-filter="Selesai">Selesai</button>
    </div>
    <p id="summary" class="summary"></p>
    <ul id="list" class="list"></ul>
  </main>
`;

const form = document.querySelector<HTMLFormElement>('#form')!;
const judulInput = document.querySelector<HTMLInputElement>('#judul')!;
const matkulInput = document.querySelector<HTMLInputElement>('#matkul')!;
const deadlineInput = document.querySelector<HTMLInputElement>('#deadline')!;
const formTitle = document.querySelector<HTMLHeadingElement>('#form-title')!;
const submitBtn = document.querySelector<HTMLButtonElement>('#submit-btn')!;
const cancelBtn = document.querySelector<HTMLButtonElement>('#cancel-btn')!;
const listEl = document.querySelector<HTMLUListElement>('#list')!;
const summaryEl = document.querySelector<HTMLParagraphElement>('#summary')!;
const filterBtns = document.querySelectorAll<HTMLButtonElement>('.filters button');

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function simpan(): void {
  saveData<Tugas[]>(STORAGE_KEY, daftarTugas);
}

function resetForm(): void {
  editingId = null;
  form.reset();
  formTitle.textContent = 'Tambah Tugas';
  submitBtn.textContent = 'Tambah';
  cancelBtn.classList.add('hidden');
}

function render(): void {
  const tampil: Tugas[] =
    filter === 'Semua' ? daftarTugas : daftarTugas.filter((t) => t.status === filter);

  const selesai: number = daftarTugas.filter((t) => t.status === 'Selesai').length;
  summaryEl.textContent = `${selesai} dari ${daftarTugas.length} tugas selesai`;

  const kosong: boolean = tampil.length === 0;
  if (kosong) {
    listEl.innerHTML = `<li class="empty">Belum ada tugas.</li>`;
    return;
  }

  listEl.innerHTML = tampil
    .map(
      (t) => `
    <li class="item ${t.status === 'Selesai' ? 'done' : ''}">
      <div class="info">
        <strong>${escapeHtml(t.judul)}</strong>
        <span>${escapeHtml(t.matkul)} • Deadline: ${escapeHtml(t.deadline)}</span>
        <span class="status ${t.status === 'Selesai' ? 'ok' : 'pending'}">${t.status}</span>
      </div>
      <div class="buttons">
        <button data-action="toggle" data-id="${t.id}">
          ${t.status === 'Selesai' ? 'Batalkan' : 'Selesai'}
        </button>
        <button data-action="edit" data-id="${t.id}" class="secondary">Edit</button>
        <button data-action="delete" data-id="${t.id}" class="danger">Hapus</button>
      </div>
    </li>`
    )
    .join('');
}

form.addEventListener('submit', (e: Event) => {
  e.preventDefault();
  const judul: string = judulInput.value.trim();
  const matkul: string = matkulInput.value.trim();
  const deadline: string = deadlineInput.value;
  if (!judul || !matkul || !deadline) return;

  if (editingId !== null) {
    daftarTugas = daftarTugas.map((t) =>
      t.id === editingId ? { ...t, judul, matkul, deadline } : t
    );
  } else {
    const baru: Tugas = {
      id: Date.now(),
      judul,
      matkul,
      deadline,
      status: 'Belum Selesai',
    };
    daftarTugas.push(baru);
  }

  simpan();
  resetForm();
  render();
});

cancelBtn.addEventListener('click', resetForm);

listEl.addEventListener('click', (e: Event) => {
  const target = e.target as HTMLElement;
  const action = target.dataset.action;
  const id = Number(target.dataset.id);
  if (!action) return;

  if (action === 'toggle') {
    daftarTugas = daftarTugas.map((t) => {
      if (t.id !== id) return t;
      const statusBaru: Status = t.status === 'Selesai' ? 'Belum Selesai' : 'Selesai';
      return { ...t, status: statusBaru };
    });
    simpan();
    render();
  } else if (action === 'delete') {
    if (confirm('Hapus tugas ini?')) {
      daftarTugas = daftarTugas.filter((t) => t.id !== id);
      simpan();
      render();
    }
  } else if (action === 'edit') {
    const t = daftarTugas.find((x) => x.id === id);
    if (!t) return;
    editingId = t.id;
    judulInput.value = t.judul;
    matkulInput.value = t.matkul;
    deadlineInput.value = t.deadline;
    formTitle.textContent = 'Edit Tugas';
    submitBtn.textContent = 'Simpan';
    cancelBtn.classList.remove('hidden');
    judulInput.focus();
  }
});

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter as FilterType;
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
});

render();