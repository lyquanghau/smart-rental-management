function createRoomsForFloor(floor) {
  return Array.from({ length: 10 }, (_, index) => {
    const roomNumber = `${floor}${String(index + 1).padStart(2, '0')}`;
    const occupiedRooms = ['101', '102', '103', '104'];
    const maintenanceRooms = ['301'];

    return {
      floor,
      maxOccupants: 2,
      name: roomNumber,
      price: 2500000,
      status: maintenanceRooms.includes(roomNumber)
        ? 'maintenance'
        : occupiedRooms.includes(roomNumber)
          ? 'occupied'
          : 'available',
    };
  });
}

function addDays(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function previousMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

const billingPeriod = previousMonth();

export const rooms = [
  ...createRoomsForFloor(1),
  ...createRoomsForFloor(2),
  ...createRoomsForFloor(3),
];

export const users = [
  {
    email: 'admin@smartrental.local',
    fullName: 'Admin Smart Rental',
    password: 'Admin@123456',
    role: 'landlord',
    username: 'admin',
  },
  {
    email: 'tenant@smartrental.local',
    fullName: 'Nguyen Van An',
    password: 'Tenant@123456',
    role: 'tenant',
    username: 'nguyenvanan101',
  },
];

export const tenants = [
  {
    email: 'tenant@smartrental.local',
    fullName: 'Nguyen Van An',
    identityNumber: '079200000101',
    phone: '0901000101',
    roomName: '101',
    userEmail: 'tenant@smartrental.local',
  },
  {
    email: 'binh@example.com',
    fullName: 'Tran Thi Binh',
    identityNumber: '079200000102',
    phone: '0901000102',
    roomName: '102',
  },
  {
    email: 'cuong@example.com',
    fullName: 'Le Minh Cuong',
    identityNumber: '079200000103',
    phone: '0901000103',
    roomName: '103',
  },
  {
    email: 'dung@example.com',
    fullName: 'Pham Hoang Dung',
    identityNumber: '079200000104',
    phone: '0901000104',
    roomName: '104',
  },
];

export const contracts = [
  {
    deposit: 2500000,
    monthlyPrice: 2500000,
    roomName: '101',
    startDate: addDays(-120),
    status: 'active',
    tenantEmail: 'tenant@smartrental.local',
  },
  {
    deposit: 2500000,
    monthlyPrice: 2500000,
    roomName: '102',
    startDate: addDays(-90),
    status: 'active',
    tenantEmail: 'binh@example.com',
  },
  {
    deposit: 2700000,
    monthlyPrice: 2700000,
    roomName: '103',
    startDate: addDays(-60),
    status: 'active',
    tenantEmail: 'cuong@example.com',
  },
  {
    deposit: 3000000,
    monthlyPrice: 3000000,
    roomName: '104',
    startDate: addDays(-30),
    status: 'active',
    tenantEmail: 'dung@example.com',
  },
];

export const payments = [];

export const serviceSetting = {
  bankAccountName: 'LY QUANG HAU',
  bankAccountNumber: '',
  bankCode: 'MB',
  bankName: 'TMCP Quan doi',
  electricityUnitPrice: 3500,
  internetFee: 100000,
  parkingFeePerVehicle: 100000,
  paymentNote: '',
  transferContentTemplate: 'Thanh toan phong {room} thang {month}-{year}',
  trashFee: 30000,
  waterUnitPrice: 100000,
};

export const utilityReadings = [
  {
    electricityCurrent: 165,
    electricityPrevious: 120,
    internetAmount: 100000,
    month: billingPeriod.month,
    note: 'Chi so mau - phong chua den han thanh toan',
    parkingVehicleCount: 1,
    tenantEmail: 'tenant@smartrental.local',
    trashAmount: 30000,
    waterCurrent: 18,
    waterPrevious: 12,
    year: billingPeriod.year,
  },
  {
    electricityCurrent: 210,
    electricityPrevious: 150,
    internetAmount: 100000,
    month: billingPeriod.month,
    note: 'Chi so mau - phong sap den han thanh toan',
    parkingVehicleCount: 1,
    tenantEmail: 'binh@example.com',
    trashAmount: 30000,
    waterCurrent: 26,
    waterPrevious: 19,
    year: billingPeriod.year,
  },
  {
    electricityCurrent: 190,
    electricityPrevious: 130,
    internetAmount: 100000,
    month: billingPeriod.month,
    note: 'Chi so mau - phong tre han thanh toan',
    parkingVehicleCount: 2,
    tenantEmail: 'cuong@example.com',
    trashAmount: 30000,
    waterCurrent: 30,
    waterPrevious: 22,
    year: billingPeriod.year,
  },
  {
    electricityCurrent: 145,
    electricityPrevious: 100,
    internetAmount: 100000,
    month: billingPeriod.month,
    note: 'Chi so mau - phong da thanh toan',
    parkingVehicleCount: 0,
    tenantEmail: 'dung@example.com',
    trashAmount: 30000,
    waterCurrent: 15,
    waterPrevious: 10,
    year: billingPeriod.year,
  },
];

export const invoices = [
  {
    dueDate: addDays(14),
    month: billingPeriod.month,
    note: 'Demo: phong 101 chua den han thanh toan',
    status: 'issued',
    tenantEmail: 'tenant@smartrental.local',
    year: billingPeriod.year,
  },
  {
    dueDate: addDays(3),
    month: billingPeriod.month,
    note: 'Demo: phong 102 sap den han thanh toan',
    status: 'issued',
    tenantEmail: 'binh@example.com',
    year: billingPeriod.year,
  },
  {
    dueDate: addDays(-5),
    month: billingPeriod.month,
    note: 'Demo: phong 103 tre han thanh toan',
    status: 'overdue',
    tenantEmail: 'cuong@example.com',
    year: billingPeriod.year,
  },
  {
    dueDate: addDays(-1),
    month: billingPeriod.month,
    note: 'Demo: phong 104 da thanh toan de doi chieu doanh thu',
    status: 'paid',
    tenantEmail: 'dung@example.com',
    year: billingPeriod.year,
  },
];
