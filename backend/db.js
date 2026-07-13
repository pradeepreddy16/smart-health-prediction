const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default seed data for South Indian clinics/hospitals
const SEED_CLINICS = [
  {
    id: "hosp-1",
    name: "Apollo Greams Road Hospital",
    specialty: "Cardiologist",
    address: "21 Greams Lane, Off Greams Road, Chennai, Tamil Nadu 600006",
    lat: 13.0601,
    lng: 80.2514,
    rating: 4.6,
    contact: "+91 44 2829 0200"
  },
  {
    id: "hosp-2",
    name: "Fortis Malar Hospital",
    specialty: "Cardiologist",
    address: "52, 1st Main Rd, Gandhi Nagar, Adyar, Chennai, Tamil Nadu 600020",
    lat: 13.0117,
    lng: 80.2562,
    rating: 4.2,
    contact: "+91 44 4242 4242"
  },
  {
    id: "hosp-3",
    name: "Manipal Hospital",
    specialty: "Endocrinologist",
    address: "98, HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017",
    lat: 12.9592,
    lng: 77.6444,
    rating: 4.5,
    contact: "+91 80 2502 4444"
  },
  {
    id: "hosp-4",
    name: "Aster CMI Hospital",
    specialty: "General Physician",
    address: "43/2, New Airport Road, NH-7, Sahakara Nagar, Bengaluru, Karnataka 560092",
    lat: 13.0624,
    lng: 77.5928,
    rating: 4.4,
    contact: "+91 80 4345 6789"
  },
  {
    id: "hosp-5",
    name: "NIMS (Nizam's Institute of Medical Sciences)",
    specialty: "Nephrologist",
    address: "Punjagutta, Hyderabad, Telangana 500082",
    lat: 17.4225,
    lng: 78.4533,
    rating: 4.1,
    contact: "+91 40 2348 9000"
  },
  {
    id: "hosp-6",
    name: "AIG Hospitals",
    specialty: "Gastroenterologist",
    address: "1, Mindspace Rd, Gachibowli, Hyderabad, Telangana 500032",
    lat: 17.4431,
    lng: 78.3756,
    rating: 4.7,
    contact: "+91 40 4244 4222"
  },
  {
    id: "hosp-7",
    name: "Amrita Institute of Medical Sciences",
    specialty: "Thyroid Specialist",
    address: "Ponekkara, AIMS P.O., Kochi, Kerala 682041",
    lat: 10.0315,
    lng: 76.2917,
    rating: 4.3,
    contact: "+91 484 285 1234"
  },
  {
    id: "hosp-8",
    name: "Madras Medical Mission",
    specialty: "Cardiologist",
    address: "4-A, Dr. J. Jayalalitha Nagar, Mogappair East, Chennai, Tamil Nadu 600037",
    lat: 13.0872,
    lng: 80.1916,
    rating: 4.5,
    contact: "+91 44 2656 8000"
  },
  {
    id: "hosp-9",
    name: "Government Primary Health Centre (PHC), Sholinganallur",
    specialty: "General Physician",
    address: "ECR Link Rd, Sholinganallur, Chennai, Tamil Nadu 600119",
    lat: 12.9011,
    lng: 80.2269,
    rating: 4.0,
    contact: "+91 44 2450 1201"
  },
  {
    id: "hosp-10",
    name: "Government Primary Health Centre (PHC), Devanahalli",
    specialty: "General Physician",
    address: "Devanahalli Road, Bengaluru, Karnataka 562110",
    lat: 13.2500,
    lng: 77.7167,
    rating: 3.9,
    contact: "+91 80 2768 2202"
  }
];

const getFilePath = (table) => path.join(DATA_DIR, `${table}.json`);

const readTable = (table) => {
  const filePath = getFilePath(table);
  if (!fs.existsSync(filePath)) {
    if (table === 'clinics') {
      fs.writeFileSync(filePath, JSON.stringify(SEED_CLINICS, null, 2), 'utf-8');
      return SEED_CLINICS;
    }
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading database file: ${filePath}`, error);
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
