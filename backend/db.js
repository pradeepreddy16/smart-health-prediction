const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default seed data for South Indian clinics/hospitals & specialists
const SEED_CLINICS = [
  {
    id: "hosp-1",
    name: "Dr. Priyan & Apollo Greams Road Hospital",
    specialty: "Cardiologist",
    address: "21 Greams Lane, Off Greams Road, Chennai, Tamil Nadu 600006",
    lat: 13.0601,
    lng: 80.2514,
    rating: 4.9,
    fee: 450,
    contact: "+91 44 2829 0200"
  },
  {
    id: "hosp-2",
    name: "Dr. Rajesh Sundaram — Fortis Malar",
    specialty: "Orthopedist",
    address: "52, 1st Main Rd, Gandhi Nagar, Adyar, Chennai, Tamil Nadu 600020",
    lat: 13.0117,
    lng: 80.2562,
    rating: 4.8,
    fee: 400,
    contact: "+91 44 4242 4242"
  },
  {
    id: "hosp-3",
    name: "Dr. Swaminathan & Manipal Health",
    specialty: "Endocrinologist",
    address: "98, HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017",
    lat: 12.9592,
    lng: 77.6444,
    rating: 4.7,
    fee: 500,
    contact: "+91 80 2502 4444"
  },
  {
    id: "hosp-4",
    name: "Dr. Ananya Rao — Aster CMI",
    specialty: "Pediatrician",
    address: "43/2, New Airport Road, NH-7, Sahakara Nagar, Bengaluru, Karnataka 560092",
    lat: 13.0624,
    lng: 77.5928,
    rating: 4.9,
    fee: 350,
    contact: "+91 80 4345 6789"
  },
  {
    id: "hosp-5",
    name: "Dr. Vikram Varma — NIMS Speciality",
    specialty: "Nephrologist",
    address: "Punjagutta, Hyderabad, Telangana 500082",
    lat: 17.4225,
    lng: 78.4533,
    rating: 4.6,
    fee: 550,
    contact: "+91 40 2348 9000"
  },
  {
    id: "hosp-6",
    name: "Dr. Meera Nambiar — AIG Institute",
    specialty: "Gastroenterologist",
    address: "1, Mindspace Rd, Gachibowli, Hyderabad, Telangana 500032",
    lat: 17.4431,
    lng: 78.3756,
    rating: 4.8,
    fee: 600,
    contact: "+91 40 4244 4222"
  },
  {
    id: "hosp-7",
    name: "Dr. Suresh Menon — Amrita Health",
    specialty: "ENT Specialist",
    address: "Ponekkara, AIMS P.O., Kochi, Kerala 682041",
    lat: 10.0315,
    lng: 76.2917,
    rating: 4.7,
    fee: 350,
    contact: "+91 484 285 1234"
  },
  {
    id: "hosp-8",
    name: "Dr. Lakshmi Prasad — Psychiatry Care",
    specialty: "Psychiatrist",
    address: "4-A, Dr. J. Jayalalitha Nagar, Mogappair East, Chennai, Tamil Nadu 600037",
    lat: 13.0872,
    lng: 80.1916,
    rating: 4.9,
    fee: 500,
    contact: "+91 44 2656 8000"
  },
  {
    id: "hosp-9",
    name: "Dr. Arvind Kumar — General Medicine",
    specialty: "General Physician",
    address: "ECR Link Rd, Sholinganallur, Chennai, Tamil Nadu 600119",
    lat: 12.9011,
    lng: 80.2269,
    rating: 4.5,
    fee: 300,
    contact: "+91 44 2450 1201"
  },
  {
    id: "hosp-10",
    name: "Government Primary Health Centre (PHC), Devanahalli",
    specialty: "General Physician",
    address: "Devanahalli Road, Bengaluru, Karnataka 562110",
    lat: 13.2500,
    lng: 77.7167,
    rating: 4.1,
    fee: 150,
    contact: "+91 80 2768 2202"
  }
];

const bcrypt = require('bcryptjs');

const SEED_USERS = [
  {
    id: "usr-patient-1",
    name: "John Patient",
    email: "patient@health.com",
    password: bcrypt.hashSync("patient123", 10),
    mobileNumber: "+91 98765 43210",
    role: "user",
    status: "active",
    isVerified: true,
    walletBalance: 1250,
    createdAt: "2026-06-01T10:00:00.000Z"
  },
  {
    id: "usr-demo-1",
    name: "Rahul Demo (Inspector)",
    email: "demo_patient@health.com",
    password: bcrypt.hashSync("demo123", 10),
    mobileNumber: "+91 98765 11111",
    role: "user",
    status: "active",
    isVerified: true,
    walletBalance: 500,
    createdAt: "2026-06-10T12:00:00.000Z"
  },
  {
    id: "usr-admin-1",
    name: "System Administrator",
    email: "admin@health.com",
    password: bcrypt.hashSync("admin123", 10),
    mobileNumber: "+91 99999 00000",
    role: "admin",
    status: "active",
    isVerified: true,
    walletBalance: 0,
    createdAt: "2026-05-01T08:00:00.000Z"
  }
];

const SEED_APPOINTMENTS = [
  { id: 'apt-101', userName: 'John Patient', doctorName: 'Dr. Priyan', hospitalName: 'Apollo Greams Road', date: '2026-07-22', time: '10:30 AM', fee: 450, type: 'Video', status: 'Confirmed' },
  { id: 'apt-102', userName: 'Rahul Demo', doctorName: 'Dr. Rajesh Sundaram', hospitalName: 'Fortis Malar', date: '2026-07-23', time: '02:00 PM', fee: 400, type: 'Offline', status: 'Completed' },
  { id: 'apt-103', userName: 'Ananya Rao', doctorName: 'Dr. Swaminathan', hospitalName: 'Manipal Health', date: '2026-07-24', time: '11:15 AM', fee: 500, type: 'Video', status: 'Confirmed' },
  { id: 'apt-104', userName: 'Meera Nambiar', doctorName: 'Dr. Ananya Rao', hospitalName: 'Aster CMI', date: '2026-07-25', time: '04:00 PM', fee: 350, type: 'Offline', status: 'Pending' }
];

const getFilePath = (table) => path.join(DATA_DIR, `${table}.json`);

const readTable = (table) => {
  const filePath = getFilePath(table);
  if (!fs.existsSync(filePath)) {
    if (table === 'clinics' || table === 'hospitals') {
      fs.writeFileSync(filePath, JSON.stringify(SEED_CLINICS, null, 2), 'utf-8');
      return SEED_CLINICS;
    }
    if (table === 'users') {
      fs.writeFileSync(filePath, JSON.stringify(SEED_USERS, null, 2), 'utf-8');
      return SEED_USERS;
    }
    if (table === 'appointments') {
      fs.writeFileSync(filePath, JSON.stringify(SEED_APPOINTMENTS, null, 2), 'utf-8');
      return SEED_APPOINTMENTS;
    }
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    if ((table === 'clinics' || table === 'hospitals') && (!Array.isArray(data) || data.length === 0)) {
      fs.writeFileSync(filePath, JSON.stringify(SEED_CLINICS, null, 2), 'utf-8');
      return SEED_CLINICS;
    }
    if (table === 'users' && (!Array.isArray(data) || data.length === 0)) {
      fs.writeFileSync(filePath, JSON.stringify(SEED_USERS, null, 2), 'utf-8');
      return SEED_USERS;
    }
    if (table === 'appointments' && (!Array.isArray(data) || data.length === 0)) {
      fs.writeFileSync(filePath, JSON.stringify(SEED_APPOINTMENTS, null, 2), 'utf-8');
      return SEED_APPOINTMENTS;
    }
    return data;
  } catch (error) {
    console.error(`Error reading database file: ${filePath}`, error);
    if (table === 'clinics' || table === 'hospitals') return SEED_CLINICS;
    if (table === 'users') return SEED_USERS;
    if (table === 'appointments') return SEED_APPOINTMENTS;
    return [];
  }
};

const writeTable = (table, data) => {
  const filePath = getFilePath(table);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing database file: ${filePath}`, error);
    return false;
  }
};

module.exports = {
  get: (table) => readTable(table),
  save: (table, data) => writeTable(table, data),
  
  // Custom query helpers
  findOne: (table, filterFn) => {
    const list = readTable(table);
    return list.find(filterFn) || null;
  },
  
  findMany: (table, filterFn) => {
    const list = readTable(table);
    return list.filter(filterFn);
  },
  
  insert: (table, record) => {
    const list = readTable(table);
    const id = record.id || Math.random().toString(36).substring(2, 11);
    const newRecord = { ...record, id, createdAt: new Date().toISOString() };
    list.push(newRecord);
    writeTable(table, list);
    return newRecord;
  },

  update: (table, id, updates) => {
    const list = readTable(table);
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    writeTable(table, list);
    return list[idx];
  },

  delete: (table, id) => {
    const list = readTable(table);
    const filtered = list.filter(r => r.id !== id);
    writeTable(table, filtered);
    return true;
  }
};
