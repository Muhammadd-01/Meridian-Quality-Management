/**
 * Hospital rules shared by pages, dashboards and reports.
 */
import { daysBetween, today } from './util';

export const TRIAGE = ['P1 Critical', 'P2 Urgent', 'P3 Standard', 'P4 Routine'];
export const TRIAGE_TONE = { 'P1 Critical': 'danger', 'P2 Urgent': 'warning', 'P3 Standard': 'info', 'P4 Routine': 'gray' };
export const PATIENT_STATUSES = ['Emergency', 'Admitted', 'Observation', 'Outpatient', 'Discharged'];
export const CONDITIONS = ['Stable', 'Guarded', 'Unstable', 'Critical'];
export const CONDITION_TONE = { Stable: 'success', Guarded: 'warning', Unstable: 'danger', Critical: 'danger' };

export const DOCTOR_AVAILABILITY = ['Available', 'In Surgery', 'On Call', 'Off Duty', 'On Leave'];
export const AVAILABILITY_TONE = { Available: 'success', 'In Surgery': 'warning', 'On Call': 'info', 'Off Duty': 'gray', 'On Leave': 'danger' };

export const APPOINTMENT_STATUSES = ['Scheduled', 'Checked In', 'In Progress', 'Completed', 'Cancelled', 'No Show'];
export const APPOINTMENT_TONE = { Scheduled: 'info', 'Checked In': 'accent', 'In Progress': 'warning', Completed: 'success', Cancelled: 'gray', 'No Show': 'danger' };
/** Appointments in these states do not hold a doctor's slot. */
export const RELEASED = ['Cancelled', 'No Show'];

export const BED_STATUSES = ['Available', 'Occupied', 'Cleaning', 'Maintenance', 'Reserved'];
export const BED_TONE = { Available: 'success', Occupied: 'primary', Cleaning: 'warning', Maintenance: 'danger', Reserved: 'info' };

/** Ward catalogue — beds reference a ward by `ward` (its id). */
export const WARDS = [
  { id: 'CARD', name: 'Cardiology', floor: '3rd Floor', wing: 'East wing', type: 'General' },
  { id: 'ICU', name: 'ICU', floor: '4th Floor', wing: 'Critical care', type: 'ICU' },
  { id: 'GEN', name: 'General Medicine', floor: '1st Floor', wing: 'West wing', type: 'General' },
  { id: 'PED', name: 'Pediatrics', floor: '2nd Floor', wing: 'North wing', type: 'Pediatric' },
  { id: 'MAT', name: 'Maternity', floor: '2nd Floor', wing: 'South wing', type: 'Maternity' },
];
export const wardName = (id) => WARDS.find(w => w.id === id)?.name || id || '—';

/** Bill total: services + room charges − discount. */
export const billTotal = (b) => Math.max(0,
  (Number(b.consultation) || 0) + (Number(b.roomCharges) || 0) + (Number(b.pharmacy) || 0) +
  (Number(b.lab) || 0) + (Number(b.procedures) || 0) - (Number(b.discount) || 0));
/** Amount the insurer has approved (counts only once a claim is approved). */
export const insuranceCovered = (b) => (['Approved', 'Partially Approved'].includes(b.claimStatus) ? Number(b.approvedAmount) || 0 : 0);
export const billBalance = (b) => Math.max(0, billTotal(b) - insuranceCovered(b) - (Number(b.paid) || 0));
export const billStatus = (b) => {
  const total = billTotal(b);
  const bal = billBalance(b);
  if (total > 0 && bal === 0) return 'Paid';
  if ((Number(b.paid) || 0) > 0 || insuranceCovered(b) > 0) return 'Partially Paid';
  if (b.dueDate && b.dueDate < today()) return 'Overdue';
  return 'Unpaid';
};
export const CLAIM_STATUSES = ['Not Claimed', 'Submitted', 'Under Review', 'Approved', 'Partially Approved', 'Rejected'];
export const CLAIM_TONE = { 'Not Claimed': 'gray', Submitted: 'info', 'Under Review': 'warning', Approved: 'success', 'Partially Approved': 'accent', Rejected: 'danger' };

/** Medicine alert state from stock and expiry (expiry window: 90 days). */
export const EXPIRY_WINDOW_DAYS = 90;
export function medicineAlerts(m) {
  const alerts = [];
  const stock = Number(m.stock) || 0;
  const days = m.expiryDate ? daysBetween(today(), m.expiryDate) : Infinity;
  if (days < 0) alerts.push('Expired');
  else if (days <= EXPIRY_WINDOW_DAYS) alerts.push('Expiring');
  if (stock === 0) alerts.push('Out of Stock');
  else if (stock <= (Number(m.reorderLevel) || 0)) alerts.push('Low Stock');
  return alerts;
}
export const medicineState = (m) => medicineAlerts(m)[0] || 'In Stock';
export const MED_TONE = { Expired: 'danger', 'Out of Stock': 'danger', 'Low Stock': 'warning', Expiring: 'accent', 'In Stock': 'success' };

export const AMBULANCE_STATUSES = ['Available', 'Dispatched', 'On Scene', 'Transporting', 'Returning', 'Maintenance'];
export const AMBULANCE_TONE = { Available: 'success', Dispatched: 'warning', 'On Scene': 'danger', Transporting: 'info', Returning: 'accent', Maintenance: 'gray' };
export const CALL_STAGES = ['Pending', 'Dispatched', 'On Scene', 'Transporting', 'Completed'];
export const CALL_TONE = { Pending: 'danger', Dispatched: 'warning', 'On Scene': 'accent', Transporting: 'info', Completed: 'success', Cancelled: 'gray' };
/** Unit status that follows each call stage. */
export const UNIT_FOR_STAGE = { Dispatched: 'Dispatched', 'On Scene': 'On Scene', Transporting: 'Transporting', Completed: 'Available', Cancelled: 'Available' };
