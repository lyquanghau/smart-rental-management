function createRoomsForFloor(floor) {
  return Array.from({ length: 10 }, (_, index) => {
    const roomNumber = `${floor}${String(index + 1).padStart(2, '0')}`;

    return {
      floor,
      maxOccupants: 2,
      name: roomNumber,
      price: 2500000,
      status: 'available',
    };
  });
}

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
];

export const tenants = [];

export const contracts = [];

export const payments = [];

export const serviceSetting = {
  bankAccountName: '',
  bankAccountNumber: '',
  bankCode: '',
  bankName: '',
  electricityUnitPrice: 3500,
  internetFee: 100000,
  parkingFeePerVehicle: 100000,
  paymentNote: '',
  transferContentTemplate: 'Thanh toan phong {room} thang {month}-{year}',
  trashFee: 30000,
  waterUnitPrice: 100000,
};

export const utilityReadings = [];

export const invoices = [];
