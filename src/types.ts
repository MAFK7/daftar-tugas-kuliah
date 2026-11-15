export type Status = 'Belum Selesai' | 'Selesai';
export type FilterType = 'Semua' | Status;

export interface Tugas {
  id: number;
  judul: string;
  matkul: string;
  deadline: string;
  status: Status;
}