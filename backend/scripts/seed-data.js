export const rooms = [
  {
    name: 'A101',
    floor: 1,
    price: 2500000,
    maxOccupants: 2,
    status: 'available',
  },
  {
    name: 'A102',
    floor: 1,
    price: 2700000,
    maxOccupants: 2,
    status: 'occupied',
  },
  {
    name: 'B201',
    floor: 2,
    price: 3000000,
    maxOccupants: 3,
    status: 'occupied',
  },
  {
    name: 'B202',
    floor: 2,
    price: 3200000,
    maxOccupants: 3,
    status: 'maintenance',
  },
  {
    name: 'C301',
    floor: 3,
    price: 3500000,
    maxOccupants: 4,
    status: 'occupied',
  },
];

export const users = [
  {
    fullName: 'Admin Smart Rental',
    email: 'admin@smartrental.local',
    username: 'admin',
    password: 'Admin@123456',
    role: 'landlord',
  },
  {
    fullName: 'Nguyen Van Tenant',
    email: 'tenant@smartrental.local',
    username: 'tenant-demo',
    password: 'Tenant@123456',
    role: 'tenant',
  },
];

export const tenants = [
  {
    fullName: 'Nguyen Van An',
    phone: '0901000001',
    email: 'an@example.com',
    identityNumber: '079200000001',
    roomName: 'A102',
  },
  {
    fullName: 'Tran Thi Binh',
    phone: '0901000002',
    email: 'binh@example.com',
    identityNumber: '079200000002',
    roomName: 'B201',
  },
  {
    fullName: 'Le Minh Cuong',
    phone: '0901000003',
    email: 'cuong@example.com',
    identityNumber: '079200000003',
    roomName: 'C301',
  },
];

export const contracts = [
  {
    roomName: 'A102',
    tenantEmail: 'an@example.com',
    startDate: '2026-06-01',
    monthlyPrice: 2700000,
    deposit: 2700000,
    status: 'active',
  },
];

export const payments = [
  {
    tenantEmail: 'an@example.com',
    amount: 2700000,
    dueDate: '2026-06-30',
    paidAt: '2026-06-20',
    method: 'bank_transfer',
    status: 'paid',
    note: 'Tien phong thang 6/2026',
  },
];

export const serviceSetting = {
  electricityUnitPrice: 3500,
  waterUnitPrice: 15000,
  internetFee: 100000,
  trashFee: 30000,
  parkingFeePerVehicle: 100000,
};

export const utilityReadings = [
  {
    tenantEmail: 'an@example.com',
    month: 7,
    year: 2026,
    electricityPrevious: 120,
    electricityCurrent: 168,
    waterPrevious: 45,
    waterCurrent: 57,
    internetAmount: 100000,
    trashAmount: 30000,
    parkingVehicleCount: 1,
    note: 'Chi so dich vu thang 7/2026',
  },
];

export const invoices = [
  {
    tenantEmail: 'an@example.com',
    month: 7,
    year: 2026,
    dueDate: '2026-07-30',
    status: 'issued',
    note: 'Hoa don thang 7/2026',
  },
];
