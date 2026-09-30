export const formatDue = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// Due dates are stored as UTC midnight, so compare calendar days in UTC.
export const isOverdue = (iso) => iso.slice(0, 10) < new Date().toISOString().slice(0, 10);
