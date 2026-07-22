import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  FilePlus2,
  RefreshCw,
  Save,
  Settings2,
  Zap,
} from 'lucide-react';
import { useToast } from '../components/ToastProvider.jsx';
import { usePreferences } from '../hooks/usePreferences.js';
import { getContracts } from '../services/contractService.js';
import {
  generateMonthlyInvoices,
  getInvoices,
} from '../services/invoiceService.js';
import { formatCurrency } from '../services/preferences.js';
import {
  getServiceSetting,
  updateServiceSetting,
} from '../services/serviceSettingService.js';
import {
  getUtilityReadings,
  saveUtilityReading,
} from '../services/utilityReadingService.js';

const currentDate = new Date();

const emptySetting = {
  electricityUnitPrice: '',
  waterUnitPrice: '',
  internetFee: '',
  trashFee: '',
  parkingFeePerVehicle: '',
};

const emptyReadingForm = {
  contract: '',
  electricityPrevious: '',
  electricityCurrent: '',
  waterPrevious: '',
  waterCurrent: '',
  internetAmount: '',
  trashAmount: '',
  parkingVehicleCount: '0',
  note: '',
};

const copy = {
  en: {
    activeContracts: 'active contracts',
    calculator: 'Monthly service calculator',
    dueDate: 'Invoice due date',
    electricity: 'Electricity',
    electricityCurrent: 'Current electricity index',
    electricityPrevious: 'Previous electricity index',
    electricityUnitPrice: 'Electricity price / kWh',
    emptyInvoices: 'No invoices for this month.',
    emptyReadings: 'No utility readings for this month.',
    generate: 'Generate monthly invoices',
    generated: 'Generated invoices',
    invoicedAmount: 'Invoiced amount',
    internetFee: 'Internet fee',
    invoiceSummary: 'Invoice summary',
    loading: 'Loading...',
    month: 'Month',
    note: 'Note',
    parkingFeePerVehicle: 'Parking fee / vehicle',
    parkingVehicleCount: 'Vehicles',
    readingForm: 'Record utility reading',
    readings: 'Utility readings',
    reload: 'Reload',
    rent: 'Rent',
    roomTenant: 'Room / tenant',
    saveReading: 'Save reading',
    saveSetting: 'Save service prices',
    saving: 'Saving...',
    settingsSaved: 'Service prices saved.',
    readingSaved: 'Utility reading saved.',
    invoicesGenerated: 'Monthly invoices generated.',
    selectContract: 'Select active contract',
    serviceAmount: 'Services',
    serviceSettings: 'Service prices',
    serviceTotal: 'Service total',
    total: 'Total',
    trashFee: 'Trash fee',
    visibleInvoices: 'visible invoices',
    water: 'Water',
    waterCurrent: 'Current water index',
    waterPrevious: 'Previous water index',
    waterUnitPrice: 'Water price / m3',
    year: 'Year',
  },
  vi: {
    activeContracts: 'hợp đồng đang hiệu lực',
    calculator: 'Tính dịch vụ hằng tháng',
    dueDate: 'Hạn thanh toán hóa đơn',
    electricity: 'Điện',
    electricityCurrent: 'Chỉ số điện mới',
    electricityPrevious: 'Chỉ số điện cũ',
    electricityUnitPrice: 'Đơn giá điện / kWh',
    emptyInvoices: 'Chưa có hóa đơn tháng này.',
    emptyReadings: 'Chưa có chỉ số dịch vụ tháng này.',
    generate: 'Tạo hóa đơn tháng',
    generated: 'Hóa đơn đã tạo',
    invoicedAmount: 'Tổng hóa đơn',
    internetFee: 'Phí internet',
    invoiceSummary: 'Tổng hợp hóa đơn',
    loading: 'Đang tải...',
    month: 'Tháng',
    note: 'Ghi chú',
    parkingFeePerVehicle: 'Phí gửi xe / xe',
    parkingVehicleCount: 'Số xe',
    readingForm: 'Ghi chỉ số điện nước',
    readings: 'Chỉ số dịch vụ',
    reload: 'Tải lại',
    rent: 'Tiền phòng',
    roomTenant: 'Phòng / khách thuê',
    saveReading: 'Lưu chỉ số',
    saveSetting: 'Lưu đơn giá',
    saving: 'Đang lưu...',
    settingsSaved: 'Đã lưu đơn giá dịch vụ.',
    readingSaved: 'Đã lưu chỉ số điện nước.',
    invoicesGenerated: 'Đã tạo hóa đơn tháng.',
    selectContract: 'Chọn hợp đồng active',
    serviceAmount: 'Dịch vụ',
    serviceSettings: 'Đơn giá dịch vụ',
    serviceTotal: 'Tổng dịch vụ',
    total: 'Tổng cộng',
    trashFee: 'Phí rác',
    visibleInvoices: 'hóa đơn đang hiển thị',
    water: 'Nước',
    waterCurrent: 'Chỉ số nước mới',
    waterPrevious: 'Chỉ số nước cũ',
    waterUnitPrice: 'Đơn giá nước / m3',
    year: 'Năm',
  },
};

function formatMoney(value) {
  return formatCurrency(value || 0);
}

function getContractLabel(contract) {
  const roomName = contract?.room?.name || 'N/A';
  const tenantName = contract?.tenant?.fullName || 'N/A';

  return `${roomName} - ${tenantName}`;
}

function toNumber(value) {
  return Number(value || 0);
}

function toSettingForm(setting) {
  return {
    electricityUnitPrice: String(setting?.electricityUnitPrice ?? ''),
    waterUnitPrice: String(setting?.waterUnitPrice ?? ''),
    internetFee: String(setting?.internetFee ?? ''),
    trashFee: String(setting?.trashFee ?? ''),
    parkingFeePerVehicle: String(setting?.parkingFeePerVehicle ?? ''),
  };
}

function toSettingPayload(form) {
  return {
    electricityUnitPrice: toNumber(form.electricityUnitPrice),
    waterUnitPrice: toNumber(form.waterUnitPrice),
    internetFee: toNumber(form.internetFee),
    trashFee: toNumber(form.trashFee),
    parkingFeePerVehicle: toNumber(form.parkingFeePerVehicle),
  };
}

function toReadingPayload(form, month, year) {
  return {
    contract: form.contract,
    month,
    year,
    electricityPrevious: toNumber(form.electricityPrevious),
    electricityCurrent: toNumber(form.electricityCurrent),
    waterPrevious: toNumber(form.waterPrevious),
    waterCurrent: toNumber(form.waterCurrent),
    internetAmount: toNumber(form.internetAmount),
    trashAmount: toNumber(form.trashAmount),
    parkingVehicleCount: toNumber(form.parkingVehicleCount),
    note: form.note,
  };
}

function formatDateInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export function ServicesPage() {
  const { language } = usePreferences();
  const { showError, showSuccess } = useToast();
  const text = copy[language] || copy.vi;
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [dueDate, setDueDate] = useState(
    formatDateInput(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
    ),
  );
  const [settingForm, setSettingForm] = useState(emptySetting);
  const [readingForm, setReadingForm] = useState(emptyReadingForm);
  const [contracts, setContracts] = useState([]);
  const [readings, setReadings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSetting, setIsSavingSetting] = useState(false);
  const [isSavingReading, setIsSavingReading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeContracts = useMemo(
    () => contracts.filter((contract) => contract.status === 'active'),
    [contracts],
  );

  const selectedContract = useMemo(
    () =>
      activeContracts.find((contract) => contract._id === readingForm.contract),
    [activeContracts, readingForm.contract],
  );

  const invoiceTotal = useMemo(
    () =>
      invoices.reduce(
        (total, invoice) => total + Number(invoice.totalAmount || 0),
        0,
      ),
    [invoices],
  );

  const preview = useMemo(() => {
    const setting = toSettingPayload(settingForm);
    const electricityUsage = Math.max(
      toNumber(readingForm.electricityCurrent) -
        toNumber(readingForm.electricityPrevious),
      0,
    );
    const waterUsage = Math.max(
      toNumber(readingForm.waterCurrent) - toNumber(readingForm.waterPrevious),
      0,
    );
    const electricityAmount = electricityUsage * setting.electricityUnitPrice;
    const waterAmount = waterUsage * setting.waterUnitPrice;
    const internetAmount = toNumber(readingForm.internetAmount);
    const trashAmount = toNumber(readingForm.trashAmount);
    const parkingAmount =
      toNumber(readingForm.parkingVehicleCount) * setting.parkingFeePerVehicle;

    return {
      electricityUsage,
      waterUsage,
      serviceTotal:
        electricityAmount +
        waterAmount +
        internetAmount +
        trashAmount +
        parkingAmount,
    };
  }, [readingForm, settingForm]);

  async function loadData(nextMonth = month, nextYear = year) {
    setIsLoading(true);
    setError('');

    try {
      const [setting, contractData, readingData, invoiceData] =
        await Promise.all([
          getServiceSetting(),
          getContracts(),
          getUtilityReadings({ month: nextMonth, year: nextYear }),
          getInvoices({ month: nextMonth, year: nextYear }),
        ]);

      setSettingForm(toSettingForm(setting));
      setContracts(contractData);
      setReadings(readingData);
      setInvoices(invoiceData);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateSetting(field, value) {
    setSettingForm((current) => ({ ...current, [field]: value }));
  }

  function updateReading(field, value) {
    setReadingForm((current) => ({ ...current, [field]: value }));
  }

  function selectContract(contractId) {
    setReadingForm((current) => ({
      ...current,
      contract: contractId,
      internetAmount: settingForm.internetFee,
      trashAmount: settingForm.trashFee,
    }));
  }

  async function handleMonthChange(nextMonth, nextYear = year) {
    setMonth(nextMonth);
    await loadData(nextMonth, nextYear);
  }

  async function handleYearChange(nextYear) {
    setYear(nextYear);
    await loadData(month, nextYear);
  }

  async function handleSaveSetting(event) {
    event.preventDefault();
    setIsSavingSetting(true);
    setError('');

    try {
      const setting = await updateServiceSetting(toSettingPayload(settingForm));
      setSettingForm(toSettingForm(setting));
      showSuccess(text.settingsSaved);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setIsSavingSetting(false);
    }
  }

  async function handleSaveReading(event) {
    event.preventDefault();
    setIsSavingReading(true);
    setError('');

    try {
      await saveUtilityReading(toReadingPayload(readingForm, month, year));
      setReadingForm(emptyReadingForm);
      await loadData();
      showSuccess(text.readingSaved);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setIsSavingReading(false);
    }
  }

  async function handleGenerateInvoices() {
    setIsGenerating(true);
    setError('');

    try {
      await generateMonthlyInvoices({ month, year, dueDate });
      await loadData();
      showSuccess(text.invoicesGenerated);
    } catch (err) {
      setError(err.message);
      showError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <section className="services-page">
      <div className="page-heading services-heading">
        <div>
          <span className="eyebrow">Services</span>
          <h1>{text.calculator}</h1>
        </div>
        <div className="page-actions services-period-actions">
          <label className="inline-field">
            {text.month}
            <input
              min="1"
              max="12"
              type="number"
              value={month}
              onChange={(event) =>
                handleMonthChange(Number(event.target.value))
              }
            />
          </label>
          <label className="inline-field">
            {text.year}
            <input
              min="2000"
              type="number"
              value={year}
              onChange={(event) => handleYearChange(Number(event.target.value))}
            />
          </label>
          <button
            className="secondary-button"
            disabled={isLoading}
            type="button"
            onClick={() => loadData()}
          >
            <RefreshCw className="button-icon" size={16} strokeWidth={2.5} />
            {isLoading ? text.loading : text.reload}
          </button>
        </div>
      </div>

      {error ? <p className="error-message">{error}</p> : null}

      <div className="services-summary-grid">
        <article className="service-summary-card">
          <span>{text.activeContracts}</span>
          <strong>{activeContracts.length}</strong>
        </article>
        <article className="service-summary-card">
          <span>{text.readings}</span>
          <strong>{readings.length}</strong>
        </article>
        <article className="service-summary-card">
          <span>{text.visibleInvoices}</span>
          <strong>{invoices.length}</strong>
        </article>
        <article className="service-summary-card highlight">
          <span>{text.invoicedAmount}</span>
          <strong>{formatMoney(invoiceTotal)}</strong>
        </article>
      </div>

      <div className="services-workspace">
        <form
          className="form-panel compact-form-panel service-settings-panel"
          onSubmit={handleSaveSetting}
        >
          <h2>
            <Settings2 className="button-icon" size={18} strokeWidth={2.4} />
            {text.serviceSettings}
          </h2>
          <label>
            {text.electricityUnitPrice}
            <input
              min="0"
              type="number"
              value={settingForm.electricityUnitPrice}
              onChange={(event) =>
                updateSetting('electricityUnitPrice', event.target.value)
              }
            />
          </label>
          <label>
            {text.waterUnitPrice}
            <input
              min="0"
              type="number"
              value={settingForm.waterUnitPrice}
              onChange={(event) =>
                updateSetting('waterUnitPrice', event.target.value)
              }
            />
          </label>
          <label>
            {text.internetFee}
            <input
              min="0"
              type="number"
              value={settingForm.internetFee}
              onChange={(event) =>
                updateSetting('internetFee', event.target.value)
              }
            />
          </label>
          <label>
            {text.trashFee}
            <input
              min="0"
              type="number"
              value={settingForm.trashFee}
              onChange={(event) =>
                updateSetting('trashFee', event.target.value)
              }
            />
          </label>
          <label>
            {text.parkingFeePerVehicle}
            <input
              min="0"
              type="number"
              value={settingForm.parkingFeePerVehicle}
              onChange={(event) =>
                updateSetting('parkingFeePerVehicle', event.target.value)
              }
            />
          </label>
          <button disabled={isSavingSetting} type="submit">
            <Save className="button-icon" size={16} strokeWidth={2.5} />
            {isSavingSetting ? text.saving : text.saveSetting}
          </button>
        </form>

        <form
          className="form-panel compact-form-panel service-reading-panel"
          onSubmit={handleSaveReading}
        >
          <h2>
            <Zap className="button-icon" size={18} strokeWidth={2.4} />
            {text.readingForm}
          </h2>
          <label>
            {text.roomTenant}
            <select
              required
              value={readingForm.contract}
              onChange={(event) => selectContract(event.target.value)}
            >
              <option value="">{text.selectContract}</option>
              {activeContracts.map((contract) => (
                <option key={contract._id} value={contract._id}>
                  {getContractLabel(contract)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {text.electricityPrevious}
            <input
              min="0"
              required
              type="number"
              value={readingForm.electricityPrevious}
              onChange={(event) =>
                updateReading('electricityPrevious', event.target.value)
              }
            />
          </label>
          <label>
            {text.electricityCurrent}
            <input
              min="0"
              required
              type="number"
              value={readingForm.electricityCurrent}
              onChange={(event) =>
                updateReading('electricityCurrent', event.target.value)
              }
            />
          </label>
          <label>
            {text.waterPrevious}
            <input
              min="0"
              required
              type="number"
              value={readingForm.waterPrevious}
              onChange={(event) =>
                updateReading('waterPrevious', event.target.value)
              }
            />
          </label>
          <label>
            {text.waterCurrent}
            <input
              min="0"
              required
              type="number"
              value={readingForm.waterCurrent}
              onChange={(event) =>
                updateReading('waterCurrent', event.target.value)
              }
            />
          </label>
          <label>
            {text.internetFee}
            <input
              min="0"
              type="number"
              value={readingForm.internetAmount}
              onChange={(event) =>
                updateReading('internetAmount', event.target.value)
              }
            />
          </label>
          <label>
            {text.trashFee}
            <input
              min="0"
              type="number"
              value={readingForm.trashAmount}
              onChange={(event) =>
                updateReading('trashAmount', event.target.value)
              }
            />
          </label>
          <label>
            {text.parkingVehicleCount}
            <input
              min="0"
              type="number"
              value={readingForm.parkingVehicleCount}
              onChange={(event) =>
                updateReading('parkingVehicleCount', event.target.value)
              }
            />
          </label>
          <label>
            {text.note}
            <input
              value={readingForm.note}
              onChange={(event) => updateReading('note', event.target.value)}
            />
          </label>
          <div className="metric-strip">
            <div>
              <span>{text.electricity}</span>
              <strong>{preview.electricityUsage} kWh</strong>
            </div>
            <div>
              <span>{text.water}</span>
              <strong>{preview.waterUsage} m3</strong>
            </div>
            <div>
              <span>{text.serviceTotal}</span>
              <strong>{formatMoney(preview.serviceTotal)}</strong>
            </div>
          </div>
          <button disabled={isSavingReading || !selectedContract} type="submit">
            <Save className="button-icon" size={16} strokeWidth={2.5} />
            {isSavingReading ? text.saving : text.saveReading}
          </button>
        </form>
      </div>

      <div className="table-panel compact-data-table services-table-panel">
        <div className="table-panel-header">
          <h2>
            <Calculator className="button-icon" size={18} strokeWidth={2.4} />
            {text.readings}
          </h2>
        </div>
        {isLoading ? <p>{text.loading}</p> : null}
        {!isLoading && readings.length === 0 ? (
          <p>{text.emptyReadings}</p>
        ) : null}
        {!isLoading && readings.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{text.roomTenant}</th>
                <th>{text.electricity}</th>
                <th>{text.water}</th>
                <th>{text.serviceTotal}</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((reading) => (
                <tr key={reading._id}>
                  <td>
                    <strong>{getContractLabel(reading.contract)}</strong>
                    <span>{reading.note || text.note}</span>
                  </td>
                  <td>
                    <strong>{reading.electricityUsage} kWh</strong>
                    <span>{formatMoney(reading.electricityAmount)}</span>
                  </td>
                  <td>
                    <strong>{reading.waterUsage} m3</strong>
                    <span>{formatMoney(reading.waterAmount)}</span>
                  </td>
                  <td>
                    <strong>{formatMoney(reading.serviceTotal)}</strong>
                    <span>
                      {text.parkingVehicleCount}: {reading.parkingVehicleCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      <div className="table-panel compact-data-table services-table-panel">
        <div className="table-panel-header invoice-toolbar">
          <div>
            <h2>
              <FilePlus2 className="button-icon" size={18} strokeWidth={2.4} />
              {text.invoiceSummary}
            </h2>
            <p className="page-summary">
              {invoices.length} {text.visibleInvoices}
            </p>
          </div>
          <label className="inline-field">
            {text.dueDate}
            <input
              required
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>
          <button
            disabled={isGenerating || !dueDate}
            type="button"
            onClick={handleGenerateInvoices}
          >
            <FilePlus2 className="button-icon" size={16} strokeWidth={2.5} />
            {isGenerating ? text.saving : text.generate}
          </button>
        </div>
        {!isLoading && invoices.length === 0 ? (
          <p>{text.emptyInvoices}</p>
        ) : null}
        {!isLoading && invoices.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>{text.roomTenant}</th>
                <th>{text.rent}</th>
                <th>{text.serviceAmount}</th>
                <th>{text.total}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td>
                    <strong>{getContractLabel(invoice)}</strong>
                    <span>
                      {invoice.month}/{invoice.year} - {invoice.status}
                    </span>
                  </td>
                  <td>{formatMoney(invoice.rentAmount)}</td>
                  <td>{formatMoney(invoice.serviceAmount)}</td>
                  <td>
                    <strong>{formatMoney(invoice.totalAmount)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}
