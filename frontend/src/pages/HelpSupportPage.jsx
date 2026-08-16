import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  HelpCircle,
  MessageSquareReply,
  RefreshCw,
  Send,
} from 'lucide-react';
import { useToast } from '../components/ToastProvider.jsx';
import { usePreferences } from '../hooks/usePreferences.js';
import {
  closeSupportRequest,
  createSupportRequest,
  getSupportRequests,
  updateSupportRequest,
} from '../services/supportRequestService.js';
import { getStoredUser } from '../services/sessionStorage.js';

const emptyTicketForm = {
  category: 'room',
  description: '',
  priority: 'normal',
  subject: '',
};

const copy = {
  en: {
    account: 'Account',
    allCategories: 'All categories',
    allPriorities: 'All priorities',
    allStatuses: 'All statuses',
    category: 'Category',
    categoryLabels: {
      account: 'Account',
      billing: 'Billing',
      contract: 'Contract',
      other: 'Other',
      room: 'Room',
    },
    close: 'Close ticket',
    closed: 'Closed',
    createdAt: 'Created',
    description: 'Description',
    emptyTickets: 'No support tickets yet.',
    faq: 'FAQ',
    faqItems: [
      {
        answer:
          'Go to Services, enter the monthly readings, then generate invoices for the selected month.',
        question: 'How do I generate monthly invoices?',
      },
      {
        answer:
          'Check SMTP settings in the backend environment and make sure the tenant email is valid.',
        question: 'Why did the tenant not receive account email?',
      },
      {
        answer:
          'Use the payment code shown on the invoice. SePay webhook or mock success will reconcile the invoice.',
        question: 'How are bank transfers reconciled?',
      },
    ],
    filter: 'Filter',
    inProgress: 'In progress',
    landlordReply: 'Landlord reply',
    loading: 'Loading support data...',
    newTicket: 'New support ticket',
    open: 'Open',
    pageSummary:
      'FAQ and support tickets for rental operations between tenants and landlords.',
    pageTitle: 'Help & Support',
    priority: 'Priority',
    priorityLabels: {
      normal: 'Normal',
      urgent: 'Urgent',
    },
    refresh: 'Refresh',
    replyPlaceholder: 'Write a clear response or handling note...',
    resolved: 'Resolved',
    saveReply: 'Save update',
    saving: 'Saving...',
    send: 'Send ticket',
    status: 'Status',
    statusLabels: {
      closed: 'Closed',
      in_progress: 'In progress',
      open: 'Open',
      resolved: 'Resolved',
    },
    subject: 'Subject',
    submitted: 'Support ticket sent.',
    ticketUpdated: 'Support ticket updated.',
    tenant: 'Tenant',
    tickets: 'Support tickets',
    validationDescription:
      'Please describe the issue in at least 10 characters.',
    validationSubject: 'Please enter a subject with at least 5 characters.',
  },
  vi: {
    account: 'Tài khoản',
    allCategories: 'Tất cả loại yêu cầu',
    allPriorities: 'Tất cả mức độ',
    allStatuses: 'Tất cả trạng thái',
    category: 'Loại yêu cầu',
    categoryLabels: {
      account: 'Tài khoản',
      billing: 'Hóa đơn',
      contract: 'Hợp đồng',
      other: 'Khác',
      room: 'Phòng',
    },
    close: 'Đóng yêu cầu',
    closed: 'Đã đóng',
    createdAt: 'Ngày gửi',
    description: 'Nội dung',
    emptyTickets: 'Chưa có yêu cầu hỗ trợ.',
    faq: 'Câu hỏi thường gặp',
    faqItems: [
      {
        answer:
          'Vào mục Dịch vụ, nhập chỉ số điện nước theo tháng, sau đó tạo hóa đơn cho kỳ cần thu.',
        question: 'Làm sao tạo hóa đơn tháng?',
      },
      {
        answer:
          'Kiểm tra cấu hình SMTP trong backend và đảm bảo email của khách thuê nhập đúng.',
        question: 'Vì sao khách thuê chưa nhận email tài khoản?',
      },
      {
        answer:
          'Khách chuyển khoản đúng nội dung trên hóa đơn. SePay webhook hoặc mock success sẽ đối soát hóa đơn.',
        question: 'Đối soát chuyển khoản ngân hàng hoạt động thế nào?',
      },
    ],
    filter: 'Bộ lọc',
    inProgress: 'Đang xử lý',
    landlordReply: 'Phản hồi của chủ trọ',
    loading: 'Đang tải dữ liệu hỗ trợ...',
    newTicket: 'Gửi yêu cầu hỗ trợ',
    open: 'Mới mở',
    pageSummary:
      'FAQ và ticket hỗ trợ để chủ trọ, khách thuê xử lý vấn đề vận hành thật.',
    pageTitle: 'Trợ giúp & Hỗ trợ',
    priority: 'Mức độ',
    priorityLabels: {
      normal: 'Bình thường',
      urgent: 'Khẩn cấp',
    },
    refresh: 'Tải lại',
    replyPlaceholder: 'Nhập phản hồi hoặc ghi chú xử lý rõ ràng...',
    resolved: 'Đã xử lý',
    saveReply: 'Lưu cập nhật',
    saving: 'Đang lưu...',
    send: 'Gửi yêu cầu',
    status: 'Trạng thái',
    statusLabels: {
      closed: 'Đã đóng',
      in_progress: 'Đang xử lý',
      open: 'Mới mở',
      resolved: 'Đã xử lý',
    },
    subject: 'Tiêu đề',
    submitted: 'Đã gửi yêu cầu hỗ trợ.',
    ticketUpdated: 'Đã cập nhật yêu cầu hỗ trợ.',
    tenant: 'Khách thuê',
    tickets: 'Yêu cầu hỗ trợ',
    validationDescription: 'Vui lòng mô tả vấn đề ít nhất 10 ký tự.',
    validationSubject: 'Vui lòng nhập tiêu đề ít nhất 5 ký tự.',
  },
};

const categoryOptions = ['billing', 'contract', 'room', 'account', 'other'];
const priorityOptions = ['normal', 'urgent'];
const statusOptions = ['open', 'in_progress', 'resolved', 'closed'];

function formatDate(value, language) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function statusClass(status) {
  if (status === 'resolved') return 'status-paid';
  if (status === 'closed') return 'status-cancelled';
  if (status === 'in_progress') return 'status-occupied';
  return 'status-pending';
}

function getTenantName(ticket) {
  return ticket.tenant?.fullName || ticket.requester?.fullName || '';
}

function TicketStatus({ status, text }) {
  return (
    <span className={`status ${statusClass(status)}`}>
      {text.statusLabels[status] || status}
    </span>
  );
}

export function HelpSupportPage() {
  const user = getStoredUser();
  const { language } = usePreferences();
  const { showError, showSuccess } = useToast();
  const text = copy[language] || copy.vi;
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    status: '',
  });
  const [ticketForm, setTicketForm] = useState(emptyTicketForm);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [replyForm, setReplyForm] = useState({
    landlordReply: '',
    priority: 'normal',
    status: 'open',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isLandlord = user?.role === 'landlord';
  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket._id === selectedTicketId) || null,
    [selectedTicketId, tickets],
  );

  async function loadTickets(nextFilters = filters) {
    setIsLoading(true);

    try {
      const params = Object.fromEntries(
        Object.entries(nextFilters).filter(([, value]) => value),
      );
      const data = await getSupportRequests(params);
      setTickets(data);

      if (!selectedTicketId && data.length > 0) {
        setSelectedTicketId(data[0]._id);
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (!selectedTicket) return;

    setReplyForm({
      landlordReply: selectedTicket.landlordReply || '',
      priority: selectedTicket.priority || 'normal',
      status: selectedTicket.status || 'open',
    });
  }, [selectedTicket]);

  function updateFilter(field, value) {
    const nextFilters = {
      ...filters,
      [field]: value,
    };
    setFilters(nextFilters);
    loadTickets(nextFilters);
  }

  function updateTicketForm(field, value) {
    setTicketForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateReplyForm(field, value) {
    setReplyForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateTicket(event) {
    event.preventDefault();

    if (ticketForm.subject.trim().length < 5) {
      showError(text.validationSubject);
      return;
    }

    if (ticketForm.description.trim().length < 10) {
      showError(text.validationDescription);
      return;
    }

    setIsSaving(true);

    try {
      const createdTicket = await createSupportRequest(ticketForm);
      setTicketForm(emptyTicketForm);
      setTickets((current) => [createdTicket, ...current]);
      setSelectedTicketId(createdTicket._id);
      showSuccess(text.submitted);
    } catch (error) {
      showError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateTicket(event) {
    event.preventDefault();
    if (!selectedTicket) return;

    setIsSaving(true);

    try {
      const updatedTicket = await updateSupportRequest(
        selectedTicket._id,
        replyForm,
      );
      setTickets((current) =>
        current.map((ticket) =>
          ticket._id === updatedTicket._id ? updatedTicket : ticket,
        ),
      );
      showSuccess(text.ticketUpdated);
    } catch (error) {
      showError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCloseTicket(ticket) {
    setIsSaving(true);

    try {
      const updatedTicket = await closeSupportRequest(ticket._id);
      setTickets((current) =>
        current.map((currentTicket) =>
          currentTicket._id === updatedTicket._id
            ? updatedTicket
            : currentTicket,
        ),
      );
      showSuccess(text.ticketUpdated);
    } catch (error) {
      showError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>{text.pageTitle}</h1>
          <p className="page-summary">{text.pageSummary}</p>
        </div>
        <button
          className="secondary-button"
          disabled={isLoading}
          type="button"
          onClick={() => loadTickets()}
        >
          <RefreshCw className="button-icon" size={16} strokeWidth={2.5} />
          {text.refresh}
        </button>
      </div>

      <div className="settings-grid support-layout">
        <section className="settings-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{text.faq}</span>
              <h2>{text.faq}</h2>
            </div>
            <HelpCircle size={18} strokeWidth={2.5} />
          </div>
          <div className="support-faq-list">
            {text.faqItems.map((item) => (
              <article className="support-faq-item" key={item.question}>
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        {!isLandlord ? (
          <section className="settings-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">{text.tickets}</span>
                <h2>{text.newTicket}</h2>
              </div>
              <Send size={18} strokeWidth={2.5} />
            </div>
            <form className="settings-form" onSubmit={handleCreateTicket}>
              <label>
                {text.subject}
                <input
                  required
                  minLength="5"
                  value={ticketForm.subject}
                  onChange={(event) =>
                    updateTicketForm('subject', event.target.value)
                  }
                />
              </label>
              <label>
                {text.category}
                <select
                  value={ticketForm.category}
                  onChange={(event) =>
                    updateTicketForm('category', event.target.value)
                  }
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {text.categoryLabels[category]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {text.priority}
                <select
                  value={ticketForm.priority}
                  onChange={(event) =>
                    updateTicketForm('priority', event.target.value)
                  }
                >
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {text.priorityLabels[priority]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {text.description}
                <textarea
                  required
                  minLength="10"
                  rows="5"
                  value={ticketForm.description}
                  onChange={(event) =>
                    updateTicketForm('description', event.target.value)
                  }
                />
              </label>
              <button disabled={isSaving} type="submit">
                <Send className="button-icon" size={16} strokeWidth={2.5} />
                {isSaving ? text.saving : text.send}
              </button>
            </form>
          </section>
        ) : null}

        <section className="table-panel compact-data-table support-table-panel">
          <div className="table-panel-header">
            <div>
              <span className="eyebrow">{text.tickets}</span>
              <h2>{text.tickets}</h2>
            </div>
            <div className="support-filter-row">
              <select
                className="compact-filter"
                aria-label={text.status}
                value={filters.status}
                onChange={(event) => updateFilter('status', event.target.value)}
              >
                <option value="">{text.allStatuses}</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {text.statusLabels[status]}
                  </option>
                ))}
              </select>
              <select
                className="compact-filter"
                aria-label={text.priority}
                value={filters.priority}
                onChange={(event) =>
                  updateFilter('priority', event.target.value)
                }
              >
                <option value="">{text.allPriorities}</option>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {text.priorityLabels[priority]}
                  </option>
                ))}
              </select>
              <select
                className="compact-filter"
                aria-label={text.category}
                value={filters.category}
                onChange={(event) =>
                  updateFilter('category', event.target.value)
                }
              >
                <option value="">{text.allCategories}</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {text.categoryLabels[category]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? <p className="empty-note">{text.loading}</p> : null}
          {!isLoading && tickets.length === 0 ? (
            <p className="empty-note">{text.emptyTickets}</p>
          ) : null}

          {tickets.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>{text.subject}</th>
                  {isLandlord ? <th>{text.tenant}</th> : null}
                  <th>{text.category}</th>
                  <th>{text.priority}</th>
                  <th>{text.status}</th>
                  <th>{text.createdAt}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    className={
                      ticket._id === selectedTicketId ? 'selected-row' : ''
                    }
                    key={ticket._id}
                  >
                    <td>
                      <strong>{ticket.subject}</strong>
                      {ticket.landlordReply ? (
                        <span>{ticket.landlordReply}</span>
                      ) : null}
                    </td>
                    {isLandlord ? <td>{getTenantName(ticket)}</td> : null}
                    <td>{text.categoryLabels[ticket.category]}</td>
                    <td>
                      <span
                        className={`status ${
                          ticket.priority === 'urgent'
                            ? 'status-overdue'
                            : 'status-available'
                        }`}
                      >
                        {text.priorityLabels[ticket.priority]}
                      </span>
                    </td>
                    <td>
                      <TicketStatus status={ticket.status} text={text} />
                    </td>
                    <td>{formatDate(ticket.createdAt, language)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          onClick={() => setSelectedTicketId(ticket._id)}
                        >
                          <MessageSquareReply
                            className="button-icon"
                            size={15}
                            strokeWidth={2.5}
                          />
                          {text.landlordReply}
                        </button>
                        {!isLandlord && ticket.status === 'resolved' ? (
                          <button
                            disabled={isSaving}
                            type="button"
                            onClick={() => handleCloseTicket(ticket)}
                          >
                            <CheckCircle2
                              className="button-icon"
                              size={15}
                              strokeWidth={2.5}
                            />
                            {text.close}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>

        {selectedTicket ? (
          <section className="settings-panel support-detail-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">{text.landlordReply}</span>
                <h2>{selectedTicket.subject}</h2>
              </div>
              <TicketStatus status={selectedTicket.status} text={text} />
            </div>
            <div className="support-ticket-detail">
              <p>{selectedTicket.description}</p>
              <dl>
                <div>
                  <dt>{text.category}</dt>
                  <dd>{text.categoryLabels[selectedTicket.category]}</dd>
                </div>
                <div>
                  <dt>{text.priority}</dt>
                  <dd>{text.priorityLabels[selectedTicket.priority]}</dd>
                </div>
                <div>
                  <dt>{text.createdAt}</dt>
                  <dd>{formatDate(selectedTicket.createdAt, language)}</dd>
                </div>
                {isLandlord ? (
                  <div>
                    <dt>{text.tenant}</dt>
                    <dd>{getTenantName(selectedTicket)}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {isLandlord ? (
              <form className="settings-form" onSubmit={handleUpdateTicket}>
                <label>
                  {text.status}
                  <select
                    value={replyForm.status}
                    onChange={(event) =>
                      updateReplyForm('status', event.target.value)
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {text.statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {text.priority}
                  <select
                    value={replyForm.priority}
                    onChange={(event) =>
                      updateReplyForm('priority', event.target.value)
                    }
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {text.priorityLabels[priority]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {text.landlordReply}
                  <textarea
                    rows="5"
                    placeholder={text.replyPlaceholder}
                    value={replyForm.landlordReply}
                    onChange={(event) =>
                      updateReplyForm('landlordReply', event.target.value)
                    }
                  />
                </label>
                <button disabled={isSaving} type="submit">
                  <MessageSquareReply
                    className="button-icon"
                    size={16}
                    strokeWidth={2.5}
                  />
                  {isSaving ? text.saving : text.saveReply}
                </button>
              </form>
            ) : (
              <div className="support-reply-box">
                <strong>{text.landlordReply}</strong>
                <p>{selectedTicket.landlordReply || text.emptyTickets}</p>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </section>
  );
}
