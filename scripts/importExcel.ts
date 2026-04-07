/**
 * One-time script to import data from Expense Tracker.xlsx into Firestore.
 *
 * Usage:
 *   1. Place your Firebase service account key as `serviceAccountKey.json` in this directory
 *   2. npm install xlsx firebase-admin
 *   3. npx ts-node scripts/importExcel.ts
 */

import * as admin from 'firebase-admin';
import * as XLSX from 'xlsx';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Path to the Excel file
const EXCEL_PATH = path.resolve(
  __dirname,
  '../../Expense Tracker.xlsx',
);

interface ParsedEntry {
  description: string;
  amount: number;
}

function parseSheetName(name: string): {
  label: string;
  type: 'client1' | 'client2' | 'special';
  date: Date | null;
} {
  // Try to extract a date from the sheet name
  // Common patterns: "July 26 Pay", "Aug 8", "Oct 18", "Jan 18", "Nov.18,2025"
  const monthNames: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  const cleaned = name.replace(/\n/g, ' ').trim();

  // Check for special sheets
  const specialNames = ['yanas bday', 'christmas', 'veejay', 'sheet'];
  if (specialNames.some(s => cleaned.toLowerCase().includes(s))) {
    return {label: cleaned, type: 'special', date: null};
  }

  // Try to parse "Month Day" pattern
  const match = cleaned.match(
    /([a-zA-Z]+)\.?\s*(\d{1,2})(?:,?\s*(\d{4}))?/,
  );
  if (match) {
    const monthStr = match[1].toLowerCase();
    const day = parseInt(match[2], 10);
    const year = match[3] ? parseInt(match[3], 10) : 2025;
    const month = monthNames[monthStr];

    if (month !== undefined && day >= 1 && day <= 31) {
      const date = new Date(year, month, day);
      const type = day === 5 || day === 18 ? 'client1' : 'client2';
      return {label: cleaned, type, date};
    }
  }

  return {label: cleaned, type: 'special', date: null};
}

function parseSheet(
  worksheet: XLSX.WorkSheet,
): {salary: number; expenses: ParsedEntry[]} {
  const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {header: 1});
  let salary = 0;
  const expenses: ParsedEntry[] = [];

  for (const row of jsonData) {
    if (!Array.isArray(row)) {
      continue;
    }

    // Find description and amount columns
    // Usually column B (index 1) = description, column C (index 2) = amount
    let desc = '';
    let amt = 0;

    for (let i = 0; i < row.length; i++) {
      const cell = row[i];
      if (typeof cell === 'string' && cell.trim()) {
        desc = cell.trim();
      } else if (typeof cell === 'number' && cell !== 0) {
        amt = cell;
      }
    }

    if (!desc || amt === 0) {
      continue;
    }

    // Check if this is a salary entry
    const isSalary = desc.toLowerCase().includes('salary') ||
      desc.toLowerCase().includes('received') ||
      desc.toLowerCase().includes('income') ||
      desc.toLowerCase().includes('budget');

    if (isSalary && salary === 0) {
      salary = amt;
    } else {
      expenses.push({description: desc, amount: Math.abs(amt)});
    }
  }

  return {salary, expenses};
}

async function importData() {
  console.log('Reading Excel file:', EXCEL_PATH);
  const workbook = XLSX.readFile(EXCEL_PATH);

  console.log(`Found ${workbook.SheetNames.length} sheets`);
  let imported = 0;

  for (const sheetName of workbook.SheetNames) {
    const {label, type, date} = parseSheetName(sheetName);
    const worksheet = workbook.Sheets[sheetName];
    const {salary, expenses} = parseSheet(worksheet);

    if (expenses.length === 0 && salary === 0) {
      console.log(`  Skipping empty sheet: "${sheetName}"`);
      continue;
    }

    const payDate = date || new Date(2025, 0, 1); // Default for special sheets

    // Create pay period document
    const periodRef = await db.collection('payPeriods').add({
      label,
      type,
      startDate: admin.firestore.Timestamp.fromDate(payDate),
      endDate: admin.firestore.Timestamp.fromDate(payDate),
      payDate: admin.firestore.Timestamp.fromDate(payDate),
      salary,
      createdBy: 'import',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    // Add expenses to subcollection
    const batch = db.batch();
    for (const expense of expenses) {
      const expRef = periodRef.collection('expenses').doc();
      batch.set(expRef, {
        description: expense.description,
        amount: expense.amount,
        isPaid: true, // Historical data, mark as paid
        createdBy: 'import',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }
    await batch.commit();

    imported++;
    console.log(
      `  Imported "${sheetName}": salary=${salary}, ${expenses.length} expenses`,
    );
  }

  console.log(`\nDone! Imported ${imported} pay periods.`);
  process.exit(0);
}

importData().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
