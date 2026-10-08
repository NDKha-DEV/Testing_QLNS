const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

function createDatabase(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);

  database.pragma('foreign_keys = ON');
  // WB: DB definitions - unique constraints support persistent duplicate checks.
  database.exec(`
    CREATE TABLE IF NOT EXISTS employee (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_code TEXT UNIQUE,
      full_name TEXT NOT NULL,
      gender TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      hometown TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL UNIQUE,
      address TEXT NOT NULL,
      national_id TEXT NOT NULL UNIQUE,
      tax_code TEXT,
      social_insurance_number TEXT,
      health_insurance_number TEXT,
      is_foreign_worker INTEGER NOT NULL DEFAULT 0,
      contract_status TEXT NOT NULL DEFAULT 'Chưa hợp đồng',
      work_status TEXT NOT NULL DEFAULT 'Đang chờ xét',
      portrait_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_foreign_worker (
      employee_id INTEGER PRIMARY KEY REFERENCES employee(id) ON DELETE CASCADE,
      passport_number TEXT NOT NULL UNIQUE,
      work_permit_number TEXT NOT NULL UNIQUE,
      visa_number TEXT NOT NULL,
      passport_expiry_date TEXT NOT NULL,
      visa_expiry_date TEXT NOT NULL,
      work_permit_expiry_date TEXT NOT NULL,
      work_permit_file_path TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_family (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      relationship TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_work_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
      workplace TEXT NOT NULL,
      from_date TEXT NOT NULL,
      to_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_bank (
      employee_id INTEGER PRIMARY KEY REFERENCES employee(id) ON DELETE CASCADE,
      account_number TEXT NOT NULL,
      bank_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_membership (
      employee_id INTEGER PRIMARY KEY REFERENCES employee(id) ON DELETE CASCADE,
      join_date TEXT NOT NULL,
      details TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_education (
      employee_id INTEGER PRIMARY KEY REFERENCES employee(id) ON DELETE CASCADE,
      education_level TEXT NOT NULL,
      academic_title TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_degree (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL,
      file_path TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_certificate (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL,
      file_path TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employee_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employee_file (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      original_name TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organization_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_unit_id INTEGER REFERENCES organization_units(id),
      unit_name TEXT NOT NULL,
      unit_code TEXT NOT NULL UNIQUE,
      unit_type TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      website TEXT,
      address TEXT,
      status TEXT NOT NULL DEFAULT 'Đang hoạt động',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      employee_id INTEGER NOT NULL UNIQUE REFERENCES employee(id),
      username TEXT NOT NULL UNIQUE,
      default_password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_coefficients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coefficient_code TEXT NOT NULL UNIQUE,
      civil_servant_rank TEXT NOT NULL,
      salary_step INTEGER NOT NULL,
      coefficient REAL NOT NULL,
      UNIQUE (civil_servant_rank, salary_step)
    );
  `);

  return database;
}

module.exports = { createDatabase };
