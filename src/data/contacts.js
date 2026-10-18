/**
 * Demo contact directory. There was no separate contact list before, so the
 * seed is derived from the contact people already named on company and lead
 * records. Every seeded record carries `isDemo: true` and a `source` so the
 * Contacts page can label it.
 */
import { initialCompanies } from './crmData';
import { initialLeads } from './leads';

export const contactStatuses = ['Active', 'Inactive'];
export const contactSources = ['Company record', 'Lead', 'Manual', 'Import'];

const norm = (s) => String(s ?? '').trim().toLowerCase();

function buildSeed() {
  const contacts = [];
  const seen = new Set();
  const add = (record) => {
    const k = norm(record.name);
    if (!k || seen.has(k)) return;
    seen.add(k);
    contacts.push({ id: `contact-${String(contacts.length + 1).padStart(3, '0')}`, ...record });
  };

  initialCompanies.forEach(c => add({
    name: c.contactPerson,
    company: c.name,
    role: c.contactRole || '',
    email: c.email || '',
    phone: c.phone || '',
    location: c.location || '',
    source: 'Company record',
    status: 'Active',
    tags: [c.relationship].filter(Boolean),
    notes: '',
    isDemo: true,
  }));

  initialLeads.forEach(l => add({
    name: l.contactName,
    company: l.company,
    role: '',
    email: l.email || '',
    phone: l.phone || '',
    location: '',
    source: 'Lead',
    status: l.status === 'Lost' ? 'Inactive' : 'Active',
    tags: ['Lead'],
    notes: l.notes || '',
    isDemo: true,
  }));

  return contacts;
}

export const initialContacts = buildSeed();
