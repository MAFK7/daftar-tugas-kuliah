const dialog = document.querySelector<HTMLDialogElement>('#dialog-penjelasan');
const buka = document.querySelector<HTMLButtonElement>('#buka-penjelasan');
const tutup = document.querySelector<HTMLButtonElement>('#tutup-penjelasan');

buka?.addEventListener('click', () => dialog?.showModal());
tutup?.addEventListener('click', () => dialog?.close());

export { };