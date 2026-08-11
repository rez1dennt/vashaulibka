export function createAppointmentProvider() {
  return Object.freeze({
    mode: 'phone-only',
    open() {
      return { mode: 'phone-only' };
    },
  });
}
