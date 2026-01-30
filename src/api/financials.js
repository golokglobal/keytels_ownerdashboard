import { delay } from './api';
import { subDays, addDays, format } from 'date-fns';

const generateMockInvoices = () => {
  const statuses = ['paid', 'pending', 'overdue'];

  return Array.from({ length: 30 }, (_, i) => {
    const amount = 500 + Math.floor(Math.random() * 2000);
    const issueDate = subDays(new Date(), Math.floor(Math.random() * 60));
    const dueDate = addDays(issueDate, 14);
    const status = i < 5 ? 'pending' : (i < 8 ? 'overdue' : 'paid');

    return {
      id: `INV-${String(i + 1).padStart(5, '0')}`,
      bookingId: `BK${String(i + 1).padStart(5, '0')}`,
      guestName: `Guest ${i + 1}`,
      amount,
      paidAmount: status === 'paid' ? amount : (status === 'overdue' ? 0 : Math.floor(amount * 0.3)),
      issueDate: format(issueDate, 'yyyy-MM-dd'),
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      status,
      items: [
        { description: 'Room charges', amount: amount * 0.7 },
        { description: 'Service charges', amount: amount * 0.2 },
        { description: 'Tax', amount: amount * 0.1 },
      ],
    };
  });
};

const generateMockPayments = () => {
  const methods = ['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'PayPal'];

  return Array.from({ length: 50 }, (_, i) => ({
    id: `PAY-${String(i + 1).padStart(5, '0')}`,
    invoiceId: `INV-${String(Math.floor(i / 2) + 1).padStart(5, '0')}`,
    amount: 500 + Math.floor(Math.random() * 2000),
    method: methods[Math.floor(Math.random() * methods.length)],
    date: format(subDays(new Date(), Math.floor(Math.random() * 90)), 'yyyy-MM-dd HH:mm:ss'),
    status: 'completed',
    transactionId: `TXN${Date.now()}${i}`,
  }));
};

const mockInvoices = generateMockInvoices();
const mockPayments = generateMockPayments();

export const fetchInvoices = async (filters = {}) => {
  await delay();

  let filtered = [...mockInvoices];

  if (filters.status) {
    filtered = filtered.filter(inv => inv.status === filters.status);
  }

  return {
    success: true,
    invoices: filtered.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate)),
  };
};

export const fetchInvoiceById = async (id) => {
  await delay();
  const invoice = mockInvoices.find(inv => inv.id === id);

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  return { success: true, invoice };
};

export const fetchPayments = async () => {
  await delay();

  return {
    success: true,
    payments: mockPayments.sort((a, b) => new Date(b.date) - new Date(a.date)),
  };
};

export const createPayment = async (paymentData) => {
  await delay();

  const newPayment = {
    id: `PAY-${String(mockPayments.length + 1).padStart(5, '0')}`,
    ...paymentData,
    date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    status: 'completed',
    transactionId: `TXN${Date.now()}`,
  };

  mockPayments.unshift(newPayment);

  return { success: true, payment: newPayment };
};
