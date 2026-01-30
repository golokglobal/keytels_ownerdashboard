import { delay } from './api';
import { subDays, format } from 'date-fns';

const mockTickets = [
  {
    id: 'TKT-001',
    subject: 'Room AC not working',
    description: 'The air conditioning in room 302 is not working properly. Guest is complaining about the heat.',
    status: 'open',
    priority: 'high',
    category: 'maintenance',
    createdBy: 'John Doe',
    assignedTo: 'Maintenance Team',
    createdAt: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm:ss'),
    roomNumber: '302',
  },
  {
    id: 'TKT-002',
    subject: 'Late checkout request',
    description: 'Guest in room 105 requesting late checkout until 3 PM.',
    status: 'resolved',
    priority: 'medium',
    category: 'request',
    createdBy: 'Front Desk',
    assignedTo: 'Management',
    createdAt: format(subDays(new Date(), 2), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    roomNumber: '105',
    resolution: 'Late checkout approved',
  },
  {
    id: 'TKT-003',
    subject: 'Payment processing issue',
    description: 'Unable to process credit card payment for booking BK00123',
    status: 'in-progress',
    priority: 'high',
    category: 'billing',
    createdBy: 'Sarah Johnson',
    assignedTo: 'Finance Team',
    createdAt: format(subDays(new Date(), 3), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm:ss'),
    bookingId: 'BK00123',
  },
  {
    id: 'TKT-004',
    subject: 'WiFi connectivity issues',
    description: 'Multiple guests reporting slow WiFi on the 2nd floor',
    status: 'open',
    priority: 'medium',
    category: 'technical',
    createdBy: 'IT Team',
    assignedTo: 'IT Team',
    createdAt: format(subDays(new Date(), 4), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 4), 'yyyy-MM-dd HH:mm:ss'),
    floor: 2,
  },
  {
    id: 'TKT-005',
    subject: 'Complaint about noise',
    description: 'Guest in room 401 complaining about noise from the adjacent room',
    status: 'resolved',
    priority: 'low',
    category: 'complaint',
    createdBy: 'Night Manager',
    assignedTo: 'Guest Relations',
    createdAt: format(subDays(new Date(), 5), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(subDays(new Date(), 4), 'yyyy-MM-dd HH:mm:ss'),
    roomNumber: '401',
    resolution: 'Guest moved to quieter room',
  },
];

export const fetchTickets = async (filters = {}) => {
  await delay();

  let filtered = [...mockTickets];

  if (filters.status) {
    filtered = filtered.filter(t => t.status === filters.status);
  }

  if (filters.priority) {
    filtered = filtered.filter(t => t.priority === filters.priority);
  }

  return {
    success: true,
    tickets: filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  };
};

export const fetchTicketById = async (id) => {
  await delay();
  const ticket = mockTickets.find(t => t.id === id);

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Add mock updates/comments
  const updates = [
    {
      id: 1,
      author: ticket.assignedTo,
      message: 'Looking into this issue',
      timestamp: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm:ss'),
    },
  ];

  return {
    success: true,
    ticket: { ...ticket, updates },
  };
};

export const createTicket = async (ticketData) => {
  await delay();

  const newTicket = {
    id: `TKT-${String(mockTickets.length + 1).padStart(3, '0')}`,
    ...ticketData,
    status: 'open',
    createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  };

  mockTickets.unshift(newTicket);

  return { success: true, ticket: newTicket };
};

export const updateTicket = async (id, updates) => {
  await delay();

  const index = mockTickets.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Ticket not found');
  }

  mockTickets[index] = {
    ...mockTickets[index],
    ...updates,
    updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  };

  return { success: true, ticket: mockTickets[index] };
};
