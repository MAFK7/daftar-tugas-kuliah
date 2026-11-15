import './style.css';
import type { Tugas, Status, FilterType } from './types';
import { loadData, saveData } from './storage';

// Environment variables
const appName: string = import.meta.env.VITE_APP_NAME;
const appVersion: string = import.meta.env.VITE_APP_VERSION;
const STORAGE_KEY = 'tugas-kuliah';

// Pisahkan kata terakhir judul untuk efek sticker
const kataJudul: string[] = appName.split(' ');
const kataTerakhir: string = kataJudul.pop() ?? '';
const kataAwal: string = kataJudul.join(' ');

// State
let daftarTugas: Tugas[] = loadData<Tugas[]>(STORAGE_KEY, []);
let editingId: number | null = null;
let filter: FilterType = 'Semua';
let animasiAwal: boolean = true;

document.title = appName;

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="wrap">
    <h1 class="title">${kataAwal} <span class="sticker">${kataTerakhir}</span></h1>

    <form id="form" class="card">
      <h2 id="form-title" class="label">Tambah Tugas</h2>
      <div class="form-grid">
        <input id="judul" class="full" placeholder="Judul tugas" required />
        <input id="matkul" placeholder="Mata kuliah" required />
        <input id="deadline" type="date" required />
      </div>
      <div class="actions">
        <button type="submit" id="submit-btn" class="btn btn-primary">Tambah</button>
        <button type="button" id="cancel-btn" class="btn btn-cancel hidden">Batal</button>
      </div>
    </form>

    <div class="toolbar">
      <div class="filters">
        <button data-filter="Semua" class="chip active">Semua</button>
        <button data-filter="Belum Selesai" class="chip">Belum Selesai</button>
        <button data-filter="Selesai" class="chip">Selesai</button>
      </div>
      <p id="summary" class="summary"></p>
    </div>

    <ul id="list" class="list"></ul>

    <p class="foot">v${appVersion}</p>
  </div>
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

function formatTanggal(iso: string): string {
  const bulan: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const [tahun, bln, hari] = iso.split('-');
  return `${Number(hari)} ${bulan[Number(bln) - 1]} ${tahun}`;
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

  const kelasMasuk: string = animasiAwal ? 'enter' : '';

  listEl.innerHTML = tampil
    .map(
      (t, i) => `
    <li class="item ${t.status === 'Selesai' ? 'done' : ''} ${kelasMasuk}" style="animation-delay:${i * 50}ms">
      <div class="info">
        <strong>${escapeHtml(t.judul)}</strong>
        <span class="meta">${escapeHtml(t.matkul)} • Deadline: ${formatTanggal(t.deadline)}</span>
        <span class="status ${t.status === 'Selesai' ? 'ok' : 'pending'}">${t.status}</span>
      </div>
      <div class="buttons">
        <button data-action="toggle" data-id="${t.id}" class="btn-sm">
          ${t.status === 'Selesai' ? 'Batalkan' : 'Selesai'}
        </button>
        <button data-action="edit" data-id="${t.id}" class="btn-sm">Edit</button>
        <button data-action="delete" data-id="${t.id}" class="btn-sm">Hapus</button>
      </div>
    </li>`
    )
    .join('');

  animasiAwal = false;
}

// Tambah atau simpan hasil edit
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

// Toggle status, edit, hapus
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

// Filter
filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter as FilterType;
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
});

render();