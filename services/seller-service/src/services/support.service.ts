import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';

// In-memory store for demo
const ticketStore = new Map<string, any>();

interface CreateTicketInput {
  sellerId: string;
  subject: string;
  category: 'technical' | 'billing' | 'product' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  attachments?: string[];
}

interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: 'seller' | 'support' | 'admin';
  message: string;
  attachments?: string[];
  createdAt: Date;
}

export class SupportService {
  /**
   * Create a support ticket
   */
  async createTicket(input: CreateTicketInput): Promise<any> {
    const ticketId = generateId('tkt');

    const ticket = {
      id: ticketId,
      sellerId: input.sellerId,
      subject: input.subject,
      category: input.category,
      priority: input.priority,
      description: input.description,
      status: 'open',
      assignedTo: null,
      messages: [],
      attachments: input.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
    };

    ticketStore.set(ticketId, ticket);

    return ticket;
  }

  /**
   * Get seller's tickets
   */
  async getSellerTickets(
    sellerId: string,
    options: { status?: string; category?: string; page: number; limit: number }
  ): Promise<{ data: any[]; total: number }> {
    let tickets = Array.from(ticketStore.values())
      .filter((t) => t.sellerId === sellerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options.status) {
      tickets = tickets.filter((t) => t.status === options.status);
    }

    if (options.category) {
      tickets = tickets.filter((t) => t.category === options.category);
    }

    const total = tickets.length;
    const start = (options.page - 1) * options.limit;
    const paginatedData = tickets.slice(start, start + options.limit);

    return { data: paginatedData, total };
  }

  /**
   * Get ticket details
   */
  async getTicket(ticketId: string, sellerId: string): Promise<any> {
    const ticket = ticketStore.get(ticketId);

    if (!ticket || ticket.sellerId !== sellerId) {
      throw new NotFoundError('Ticket');
    }

    return ticket;
  }

  /**
   * Add message to ticket
   */
  async addMessage(
    ticketId: string,
    sellerId: string,
    message: string,
    attachments?: string[]
  ): Promise<TicketMessage> {
    const ticket = await this.getTicket(ticketId, sellerId);

    const messageId = generateId('msg');
    const ticketMessage: TicketMessage = {
      id: messageId,
      ticketId,
      senderId: sellerId,
      senderType: 'seller',
      message,
      attachments: attachments || [],
      createdAt: new Date(),
    };

    ticket.messages.push(ticketMessage);
    ticket.updatedAt = new Date();
    ticket.status = ticket.status === 'resolved' ? 'reopened' : ticket.status;

    ticketStore.set(ticketId, ticket);

    return ticketMessage;
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(
    ticketId: string,
    sellerId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ): Promise<any> {
    const ticket = await this.getTicket(ticketId, sellerId);

    ticket.status = status;
    ticket.updatedAt = new Date();

    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
    }

    ticketStore.set(ticketId, ticket);

    return ticket;
  }

  /**
   * Get all tickets (Admin/Support)
   */
  async getAllTickets(options: {
    status?: string;
    priority?: string;
    category?: string;
    page: number;
    limit: number;
  }): Promise<{ data: any[]; total: number }> {
    let tickets = Array.from(ticketStore.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options.status) {
      tickets = tickets.filter((t) => t.status === options.status);
    }

    if (options.priority) {
      tickets = tickets.filter((t) => t.priority === options.priority);
    }

    if (options.category) {
      tickets = tickets.filter((t) => t.category === options.category);
    }

    const total = tickets.length;
    const start = (options.page - 1) * options.limit;
    const paginatedData = tickets.slice(start, start + options.limit);

    return { data: paginatedData, total };
  }

  /**
   * Assign ticket to support agent
   */
  async assignTicket(ticketId: string, agentId: string): Promise<any> {
    const ticket = ticketStore.get(ticketId);

    if (!ticket) {
      throw new NotFoundError('Ticket');
    }

    ticket.assignedTo = agentId;
    ticket.status = 'in_progress';
    ticket.updatedAt = new Date();

    ticketStore.set(ticketId, ticket);

    return ticket;
  }

  /**
   * Get ticket statistics
   */
  async getTicketStatistics(sellerId: string): Promise<{
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    averageResolutionTime: number; // hours
  }> {
    const tickets = Array.from(ticketStore.values()).filter((t) => t.sellerId === sellerId);

    const stats = {
      open: tickets.filter((t) => t.status === 'open').length,
      inProgress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
      closed: tickets.filter((t) => t.status === 'closed').length,
      averageResolutionTime: 0,
    };

    const resolvedTickets = tickets.filter(
      (t) => t.status === 'resolved' && t.resolvedAt && t.createdAt
    );

    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((sum, t) => {
        const hours = (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      stats.averageResolutionTime = Math.round((totalHours / resolvedTickets.length) * 10) / 10;
    }

    return stats;
  }
}
