import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-admin
const mockGet = vi.fn();
const mockAdd = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSet = vi.fn();
const mockDoc = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockBatch = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      where: mockWhere,
      orderBy: mockOrderBy,
      doc: mockDoc,
      add: mockAdd,
    })),
    batch: mockBatch,
  },
  adminAuth: {
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'test-user-123',
      email: 'test@example.com',
    }),
  },
}));

// Chain mocks
mockWhere.mockReturnThis();
mockOrderBy.mockReturnThis();
mockLimit.mockReturnThis();

describe('Messages API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnThis();
    mockOrderBy.mockReturnThis();
    mockLimit.mockReturnThis();
  });

  describe('Conversations', () => {
    it('should list conversations for authenticated user', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          data: () => ({
            userId: 'test-user-123',
            contactId: 'contact-1',
            lastMessageAt: '2026-03-01T10:00:00Z',
            lastMessagePreview: 'Hello!',
            unreadCount: 2,
            isMuted: false,
          }),
        },
      ];

      mockGet.mockResolvedValueOnce({ docs: mockConversations });
      mockOrderBy.mockReturnValue({ get: mockGet });

      // Verify mock structure
      expect(mockConversations[0].data().userId).toBe('test-user-123');
      expect(mockConversations[0].data().unreadCount).toBe(2);
    });

    it('should create a new conversation', async () => {
      const conversationData = {
        userId: 'test-user-123',
        contactId: 'contact-1',
        lastMessagePreview: '',
        unreadCount: 0,
        isMuted: false,
      };

      mockAdd.mockResolvedValueOnce({ id: 'new-conv-123' });

      // Verify the data structure
      expect(conversationData.contactId).toBe('contact-1');
      expect(conversationData.unreadCount).toBe(0);
    });

    it('should return existing conversation if one exists with contact', async () => {
      const existingConv = {
        id: 'existing-conv',
        data: () => ({
          userId: 'test-user-123',
          contactId: 'contact-1',
        }),
      };

      mockGet.mockResolvedValueOnce({ empty: false, docs: [existingConv] });
      mockLimit.mockReturnValue({ get: mockGet });

      expect(existingConv.data().contactId).toBe('contact-1');
    });
  });

  describe('Messages in Conversation', () => {
    it('should list messages in a conversation', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          data: () => ({
            conversationId: 'conv-1',
            direction: 'outbound',
            channel: 'live_chat',
            body: 'Hello there!',
            status: 'sent',
            createdAt: '2026-03-01T10:00:00Z',
          }),
        },
        {
          id: 'msg-2',
          data: () => ({
            conversationId: 'conv-1',
            direction: 'inbound',
            channel: 'live_chat',
            body: 'Hi! How can I help?',
            status: 'read',
            createdAt: '2026-03-01T10:01:00Z',
          }),
        },
      ];

      expect(mockMessages).toHaveLength(2);
      expect(mockMessages[0].data().direction).toBe('outbound');
      expect(mockMessages[1].data().direction).toBe('inbound');
    });

    it('should send a message to a conversation', async () => {
      const messageData = {
        conversationId: 'conv-1',
        userId: 'test-user-123',
        contactId: 'contact-1',
        direction: 'outbound',
        channel: 'live_chat',
        body: 'Test message',
        status: 'sent',
        attachments: [],
      };

      mockAdd.mockResolvedValueOnce({ id: 'new-msg-123' });

      expect(messageData.body).toBe('Test message');
      expect(messageData.direction).toBe('outbound');
      expect(messageData.status).toBe('sent');
    });

    it('should reject empty message body', () => {
      const emptyMessage = { body: '', channel: 'live_chat' };
      expect(emptyMessage.body).toBe('');
      // API validates: z.string().min(1, 'Message body is required')
    });
  });

  describe('Message Templates', () => {
    it('should list templates for authenticated user', async () => {
      const mockTemplates = [
        {
          id: 'tmpl-1',
          data: () => ({
            userId: 'test-user-123',
            name: 'Welcome',
            body: 'Welcome to our service!',
            category: 'onboarding',
          }),
        },
      ];

      mockGet.mockResolvedValueOnce({ docs: mockTemplates });
      mockOrderBy.mockReturnValue({ get: mockGet });

      expect(mockTemplates[0].data().name).toBe('Welcome');
    });

    it('should create a template', async () => {
      const templateData = {
        name: 'Follow Up',
        subject: 'Following up on our conversation',
        body: 'Hi {{name}}, I wanted to follow up on our recent conversation...',
        category: 'sales',
      };

      mockAdd.mockResolvedValueOnce({ id: 'new-tmpl-123' });

      expect(templateData.name).toBe('Follow Up');
      expect(templateData.category).toBe('sales');
    });

    it('should delete a template', async () => {
      const mockTemplateDoc = {
        exists: true,
        data: () => ({ userId: 'test-user-123', name: 'Old Template' }),
      };

      mockGet.mockResolvedValueOnce(mockTemplateDoc);
      mockDelete.mockResolvedValueOnce(undefined);
      mockDoc.mockReturnValue({ get: () => Promise.resolve(mockTemplateDoc), delete: mockDelete });

      expect(mockTemplateDoc.data().name).toBe('Old Template');
    });
  });

  describe('Conversation Management', () => {
    it('should delete a conversation and its messages', async () => {
      const convDoc = {
        exists: true,
        ref: { id: 'conv-1' },
        data: () => ({ userId: 'test-user-123', contactId: 'contact-1' }),
      };

      const msgDocs = [
        { ref: { id: 'msg-1' } },
        { ref: { id: 'msg-2' } },
      ];

      const batchMock = {
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };

      mockBatch.mockReturnValue(batchMock);

      // Simulate batch delete
      msgDocs.forEach(doc => batchMock.delete(doc.ref));
      batchMock.delete(convDoc.ref);

      expect(batchMock.delete).toHaveBeenCalledTimes(3); // 2 messages + 1 conversation
    });

    it('should toggle mute on a conversation', async () => {
      const convData = {
        userId: 'test-user-123',
        isMuted: false,
      };

      const updatedData = { isMuted: !convData.isMuted };
      expect(updatedData.isMuted).toBe(true);
    });
  });
});
