const openModals = [];

export function claimModal(modal) {
  releaseModal(modal);
  openModals.push(modal);
}

export function releaseModal(modal) {
  const index = openModals.lastIndexOf(modal);
  if (index >= 0) openModals.splice(index, 1);
}

export function isTopModal(modal) {
  return openModals.at(-1) === modal;
}
