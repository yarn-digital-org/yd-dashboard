import { describe, it, expect, vi, beforeEach } from 'vitest';

const createChain = () => {
  const chain: any = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
    add: vi.fn().mockResolvedValue({ id: 'new-doc-id' }),
    doc: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ exists: false }),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    })),
  };
  return chain;
};

let collectionChains: Record<string, ReturnType<typeof createChain>> = {};

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn((name: string) => {
      if (!collectionChains[name]) collectionChains[name] = createChain();
      return collectionChains[name];
    }),
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: 'test-jwt-token' }),
  }),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn().mockReturnValue({ userId: 'test-user-id', email: 'owner@test.com', role: 'user' }),
    sign: vi.fn().mockReturnValue('test-jwt-token'),
  },
}));

// No crypto mock needed - using simple token generator

beforeEach(() => {
  vi.clearAllMocks();
  collectionChains = {};
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long-enough';
});

// ── Portal Settings ──────────────────────────────────

describe('Portal Settings API', () => {
  it('GET returns null when no settings exist', async () => {
    const { GET } = await import('@/app/api/portal/settings/route');
    const req = new Request('http://localhost/api/portal/settings');
    const res = await GET(req as any, { params: Promise.resolve({}) });
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeNull();
  });

  it('GET returns existing settings', async () => {
    const chain = createChain();
    chain.get.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 's1', data: () => ({ userId: 'test-user-id', enabled: true, subdomain: 'mybiz' }) }],
    });
    collectionChains['portalSettings'] = chain;

    const { GET } = await import('@/app/api/portal/settings/route');
    const res = await GET(new Request('http://localhost/api/portal/settings') as any, { params: Promise.resolve({}) });
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.subdomain).toBe('mybiz');
  });

  it('PUT creates new settings', async () => {
    const chain = createChain();
    chain.get.mockResolvedValueOnce({ empty: true, docs: [] });
    chain.add.mockResolvedValueOnce({ id: 'new-id' });
    collectionChains['portalSettings'] = chain;

    const { PUT } = await import('@/app/api/portal/settings/route');
    const res = await PUT(new Request('http://localhost/api/portal/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: true, subdomain: 'test-biz', showProjects: true }),
    }) as any, { params: Promise.resolve({}) });
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.enabled).toBe(true);
    expect(chain.add).toHaveBeenCalled();
  });

  it('PUT updates existing settings', async () => {
    const chain = createChain();
    const mockUpdate = vi.fn();
    chain.get.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'existing-id' }],
    });
    chain.doc.mockReturnValueOnce({ update: mockUpdate });
    collectionChains['portalSettings'] = chain;

    const { PUT } = await import('@/app/api/portal/settings/route');
    const res = await PUT(new Request('http://localhost/api/portal/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    }) as any, { params: Promise.resolve({}) });
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('existing-id');
  });
});

// ── Portal Auth ──────────────────────────────────────

describe('Portal Auth API', () => {
  it('rejects without required fields', async () => {
    const { POST } = await import('@/app/api/portal/auth/route');
    const res = await POST(new Request('http://localhost/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }) as any);
    expect(res.status).toBe(400);
  });

  it('rejects when contact not found', async () => {
    collectionChains['contacts'] = createChain();
    const { POST } = await import('@/app/api/portal/auth/route');
    const res = await POST(new Request('http://localhost/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@test.com', userId: 'user-1' }),
    }) as any);
    expect(res.status).toBe(404);
  });

  it('rejects when portal disabled', async () => {
    const cChain = createChain();
    cChain.get.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'c1', data: () => ({ firstName: 'John', lastName: 'Doe', email: 'john@test.com' }) }],
    });
    collectionChains['contacts'] = cChain;

    const pChain = createChain();
    pChain.get.mockResolvedValueOnce({ empty: false, docs: [{ data: () => ({ enabled: false }) }] });
    collectionChains['portalSettings'] = pChain;

    const { POST } = await import('@/app/api/portal/auth/route');
    const res = await POST(new Request('http://localhost/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@test.com', userId: 'user-1' }),
    }) as any);
    expect(res.status).toBe(403);
  });

  it('creates session on successful login', async () => {
    const cChain = createChain();
    cChain.get.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'c1', data: () => ({ firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' }) }],
    });
    collectionChains['contacts'] = cChain;

    const pChain = createChain();
    pChain.get.mockResolvedValueOnce({ empty: false, docs: [{ data: () => ({ enabled: true }) }] });
    collectionChains['portalSettings'] = pChain;

    const sChain = createChain();
    sChain.add.mockResolvedValueOnce({ id: 'sess-1' });
    collectionChains['portalSessions'] = sChain;

    const aChain = createChain();
    aChain.add.mockResolvedValueOnce({ id: 'act-1' });
    collectionChains['portalActivity'] = aChain;

    const { POST } = await import('@/app/api/portal/auth/route');
    const res = await POST(new Request('http://localhost/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jane@test.com', userId: 'user-1' }),
    }) as any);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(typeof data.data.token).toBe('string');
    expect(data.data.token.length).toBe(64);
    expect(data.data.contact.firstName).toBe('Jane');
    expect(sChain.add).toHaveBeenCalled();
  });
});

// ── Portal Session Validation ────────────────────────

describe('Portal Session API', () => {
  it('rejects without token', async () => {
    const { GET } = await import('@/app/api/portal/session/route');
    const res = await GET(new Request('http://localhost/api/portal/session') as any);
    expect(res.status).toBe(401);
  });

  it('rejects expired session', async () => {
    const chain = createChain();
    chain.get.mockResolvedValueOnce({
      empty: false,
      docs: [{
        id: 's1',
        data: () => ({ token: 'old', expiresAt: '2020-01-01T00:00:00Z', contactId: 'c1', userId: 'u1' }),
      }],
    });
    // delete call for expired session
    chain.doc.mockReturnValueOnce({ delete: vi.fn() });
    collectionChains['portalSessions'] = chain;

    const { GET } = await import('@/app/api/portal/session/route');
    const res = await GET(new Request('http://localhost/api/portal/session?token=old') as any);
    expect(res.status).toBe(401);
  });
});

// ── Project Files API ────────────────────────────────

describe('Project Files API', () => {
  it('returns files for owned project', async () => {
    const pChain = createChain();
    pChain.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ userId: 'test-user-id' }) }),
    });
    collectionChains['projects'] = pChain;

    const fChain = createChain();
    fChain.get.mockResolvedValueOnce({
      docs: [{ id: 'f1', data: () => ({ filename: 'doc.pdf', size: 1024 }) }],
    });
    collectionChains['projectFiles'] = fChain;

    const { GET } = await import('@/app/api/projects/[id]/files/route');
    const res = await GET(new Request('http://localhost/api/projects/p1/files') as any, { params: Promise.resolve({ id: 'p1' }) });
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('creates file metadata', async () => {
    const pChain = createChain();
    pChain.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ userId: 'test-user-id' }) }),
    });
    collectionChains['projects'] = pChain;

    const fChain = createChain();
    fChain.add.mockResolvedValueOnce({ id: 'new-file' });
    collectionChains['projectFiles'] = fChain;

    const { POST } = await import('@/app/api/projects/[id]/files/route');
    const res = await POST(new Request('http://localhost/api/projects/p1/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'report.pdf', mimeType: 'application/pdf', size: 2048 }),
    }) as any, { params: Promise.resolve({ id: 'p1' }) });
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(res.status).toBe(201);
    expect(data.data.filename).toBe('report.pdf');
  });

  it('rejects file without filename', async () => {
    const pChain = createChain();
    pChain.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ userId: 'test-user-id' }) }),
    });
    collectionChains['projects'] = pChain;

    const { POST } = await import('@/app/api/projects/[id]/files/route');
    const res = await POST(new Request('http://localhost/api/projects/p1/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mimeType: 'application/pdf' }),
    }) as any, { params: Promise.resolve({ id: 'p1' }) });
    expect(res.status).toBe(400);
  });

  it('rejects for non-existent project', async () => {
    const pChain = createChain();
    pChain.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({ exists: false }),
    });
    collectionChains['projects'] = pChain;

    const { GET } = await import('@/app/api/projects/[id]/files/route');
    const res = await GET(new Request('http://localhost/api/projects/bad/files') as any, { params: Promise.resolve({ id: 'bad' }) });
    expect(res.status).toBe(404);
  });

  it('rejects for project owned by different user', async () => {
    const pChain = createChain();
    pChain.doc.mockReturnValueOnce({
      get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ userId: 'other-user-id' }) }),
    });
    collectionChains['projects'] = pChain;

    const { GET } = await import('@/app/api/projects/[id]/files/route');
    const res = await GET(new Request('http://localhost/api/projects/p2/files') as any, { params: Promise.resolve({ id: 'p2' }) });
    expect(res.status).toBe(404);
  });
});
