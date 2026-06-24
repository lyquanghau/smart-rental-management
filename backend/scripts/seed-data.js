export const rooms = [
  {
    name: 'A101',
    floor: 1,
    price: 2500000,
    status: 'available',
  },
  {
    name: 'A102',
    floor: 1,
    price: 2700000,
    status: 'occupied',
  },
  {
    name: 'B201',
    floor: 2,
    price: 3000000,
    status: 'available',
  },
  {
    name: 'B202',
    floor: 2,
    price: 3200000,
    status: 'maintenance',
  },
  {
    name: 'C301',
    floor: 3,
    price: 3500000,
    status: 'available',
  },
];

export const users = [
  {
    fullName: 'Admin Smart Rental',
    email: 'admin@smartrental.local',
    password: 'Admin@123456',
    role: 'landlord',
  },
  {
    fullName: 'Nguyen Van Tenant',
    email: 'tenant@smartrental.local',
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
