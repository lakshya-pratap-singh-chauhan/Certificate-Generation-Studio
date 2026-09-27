import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Helper to run query with promise
export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Helper to get single row
export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper to get all rows
export const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize DB schema
export const initDB = async () => {
  // Settings Table
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      company_name TEXT DEFAULT 'Ston Technology',
      company_address TEXT DEFAULT '123 Tech Park, Suite 400',
      company_email TEXT DEFAULT 'contact@stontechnology.com',
      company_website TEXT DEFAULT 'www.stontechnology.com',
      company_phone TEXT DEFAULT '+1 (555) 019-2834',
      ceo_signature_path TEXT,
      company_logo_path TEXT,
      next_intern_id INTEGER DEFAULT 2001,
      enable_draft_watermark INTEGER DEFAULT 0,
      verification_base_url TEXT DEFAULT 'http://localhost:5173/verify'
    )
  `);

  // Intern Records Table
  await run(`
    CREATE TABLE IF NOT EXISTS intern_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intern_id INTEGER,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      document_type TEXT NOT NULL, -- 'offer_letter' | 'certificate'
      duration TEXT NOT NULL,
      document_date TEXT NOT NULL,
      pdf_location TEXT,
      offer_letter_pdf TEXT,
      certificate_pdf TEXT,
      status TEXT DEFAULT 'Active', -- 'Active' | 'Completed' | 'Revoked'
      additional_details TEXT, -- JSON string for document-specific fields
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Audit Logs Table
  await run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // SOP Users Table
  await run(`
    CREATE TABLE IF NOT EXISTS sop_users (
      id INTEGER PRIMARY KEY,
      email TEXT,
      password TEXT,
      full_name TEXT,
      is_accepted INTEGER DEFAULT 0,
      accepted_at DATETIME
    )
  `);

  // Seed default settings row if not exists
  const settingsRow = await get('SELECT * FROM settings WHERE id = 1');
  if (!settingsRow) {
    await run(`
      INSERT INTO settings (id, company_name, next_intern_id, enable_draft_watermark)
      VALUES (1, 'Ston Technology', 2001, 0)
    `);
    await logAction('SETTINGS_INIT', 'Initialized system settings with default configurations and starting Intern ID 2001.');
  }
};

// Log action helper
export const logAction = async (action, details) => {
  try {
    await run('INSERT INTO audit_logs (action, details) VALUES (?, ?)', [action, details]);
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

// Settings CRUD
export const getSettings = async () => {
  return await get('SELECT * FROM settings WHERE id = 1');
};

export const updateSettings = async (settings) => {
  const current = await getSettings();
  const fields = [
    'company_name',
    'company_address',
    'company_email',
    'company_website',
    'company_phone',
    'ceo_signature_path',
    'company_logo_path',
    'next_intern_id',
    'enable_draft_watermark',
    'verification_base_url',
    'offer_letter_template',
    'certificate_template'
  ];

  const sets = [];
  const vals = [];

  fields.forEach((field) => {
    if (settings[field] !== undefined) {
      sets.push(`${field} = ?`);
      vals.push(settings[field]);
    }
  });

  if (sets.length === 0) return current;

  await run(`UPDATE settings SET ${sets.join(', ')} WHERE id = 1`, vals);
  await logAction('SETTINGS_UPDATE', `Updated settings: ${Object.keys(settings).join(', ')}`);
  return await getSettings();
};

// Intern ID Counter management
export const getNextInternId = async () => {
  const settings = await getSettings();
  return settings.next_intern_id;
};

export const incrementInternId = async () => {
  const nextId = await getNextInternId();
  await run('UPDATE settings SET next_intern_id = next_intern_id + 1 WHERE id = 1');
  return nextId;
};

// Records CRUD
export const addRecord = async (record) => {
  const {
    intern_id,
    full_name,
    role,
    department,
    document_type,
    duration,
    document_date,
    pdf_location,
    offer_letter_pdf,
    certificate_pdf,
    status = 'Active',
    additional_details = '{}'
  } = record;

  const result = await run(
    `INSERT INTO intern_records 
     (intern_id, full_name, role, department, document_type, duration, document_date, pdf_location, offer_letter_pdf, certificate_pdf, status, additional_details) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      intern_id,
      full_name,
      role,
      department,
      document_type,
      duration,
      document_date,
      pdf_location,
      offer_letter_pdf,
      certificate_pdf,
      status,
      additional_details
    ]
  );

  await logAction(
    'GENERATE_DOCUMENT',
    `Generated ${document_type === 'offer_letter' ? 'Offer Letter' : 'Certificate'} for ${full_name} (ID: ${intern_id})`
  );

  return result.id;
};

export const updateRecord = async (id, record) => {
  const fields = [
    'full_name',
    'role',
    'department',
    'duration',
    'document_date',
    'pdf_location',
    'offer_letter_pdf',
    'certificate_pdf',
    'status',
    'additional_details'
  ];

  const sets = [];
  const vals = [];

  fields.forEach((field) => {
    if (record[field] !== undefined) {
      sets.push(`${field} = ?`);
      vals.push(record[field]);
    }
  });

  if (sets.length === 0) return;

  vals.push(id);
  await run(`UPDATE intern_records SET ${sets.join(', ')} WHERE id = ?`, vals);

  const updated = await get('SELECT * FROM intern_records WHERE id = ?', [id]);
  await logAction('EDIT_RECORD', `Edited record for ${updated.full_name} (ID: ${updated.intern_id})`);
};

export const getRecordById = async (id) => {
  return await get('SELECT * FROM intern_records WHERE id = ?', [id]);
};

export const getRecordByInternId = async (internId) => {
  return await get('SELECT * FROM intern_records WHERE intern_id = ?', [internId]);
};

export const searchRecords = async (query = {}, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  let sql = 'SELECT * FROM intern_records';
  let countSql = 'SELECT COUNT(*) as count FROM intern_records';
  const conditions = [];
  const params = [];

  if (query.search) {
    conditions.push('(intern_id LIKE ? OR full_name LIKE ? OR role LIKE ? OR department LIKE ?)');
    const searchTerm = `%${query.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (query.document_type) {
    conditions.push('document_type = ?');
    params.push(query.document_type);
  }

  if (query.status) {
    conditions.push('status = ?');
    params.push(query.status);
  }

  if (query.date) {
    conditions.push('document_date = ?');
    params.push(query.date);
  }

  if (conditions.length > 0) {
    const whereClause = ' WHERE ' + conditions.join(' AND ');
    sql += whereClause;
    countSql += whereClause;
  }

  sql += ' ORDER BY intern_id DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, limit, offset];

  const rows = await all(sql, queryParams);
  const totalRow = await get(countSql, params);

  return {
    records: rows,
    total: totalRow ? totalRow.count : 0,
    page,
    limit
  };
};

export const getAuditLogs = async (limit = 100) => {
  return await all('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?', [limit]);
};

export const checkDuplicate = async (fullName, role) => {
  return await get(
    'SELECT * FROM intern_records WHERE LOWER(full_name) = LOWER(?) AND LOWER(role) = LOWER(?)',
    [fullName.trim(), role.trim()]
  );
};

export const createSopUser = async (email, password, fullName) => {
  const result = await run(
    'INSERT INTO sop_users (email, password, full_name) VALUES (?, ?, ?)',
    [email, password, fullName]
  );
  return result.id;
};

export const getSopUserByEmail = async (email) => {
  return await get('SELECT * FROM sop_users WHERE email = ?', [email]);
};

export const updateSopAcceptance = async (userId, isAccepted) => {
  const acceptedAt = isAccepted ? new Date().toISOString() : null;
  const acceptedInt = isAccepted ? 1 : 0;
  await run(
    'UPDATE sop_users SET is_accepted = ?, accepted_at = ? WHERE id = ?',
    [acceptedInt, acceptedAt, userId]
  );
};

