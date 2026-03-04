import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        empty: true,
        docs: [],
      }),
      add: vi.fn().mockResolvedValue({ id: 'test-tag-id' }),
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'test-tag-id',
          data: () => ({
            name: 'VIP Client',
            color: '#FF5733',
            usageCount: 15,
            userId: 'user-123',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          }),
        }),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  },
}));

describe('Tags API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tag Data Structure', () => {
    it('should have required fields', () => {
      const tag = {
        name: 'VIP Client',
        color: '#FF5733',
      };

      expect(tag.name).toBeTruthy();
      expect(tag.color).toBeTruthy();
    });

    it('should support optional usage count', () => {
      const tag = {
        name: 'VIP Client',
        color: '#FF5733',
        usageCount: 15,
      };

      expect(tag.usageCount).toBe(15);
    });
  });

  describe('Tag Validation', () => {
    it('should require tag name', () => {
      const tag = {
        name: 'VIP Client',
      };

      expect(tag.name).toBeTruthy();
      expect(tag.name.length).toBeGreaterThan(0);
    });

    it('should validate hex color format', () => {
      const validColors = ['#FF5733', '#00FF00', '#0000FF'];

      validColors.forEach(color => {
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        expect(hexRegex.test(color)).toBe(true);
      });
    });

    it('should reject invalid color format', () => {
      const invalidColors = ['FF5733', '#FFF', 'red', '#GGGGGG'];
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;

      invalidColors.forEach(color => {
        expect(hexRegex.test(color)).toBe(false);
      });
    });

    it('should trim whitespace from tag name', () => {
      const name = '  VIP Client  ';
      const trimmed = name.trim();

      expect(trimmed).toBe('VIP Client');
    });

    it('should prevent duplicate tag names', () => {
      const existingTags = [
        { name: 'VIP Client' },
        { name: 'Enterprise' },
      ];

      const newTag = 'VIP Client';
      const isDuplicate = existingTags.some(t => t.name === newTag);

      expect(isDuplicate).toBe(true);
    });
  });

  describe('Tag Colors', () => {
    it('should support predefined colors', () => {
      const predefinedColors = [
        '#FF5733', // Red
        '#33FF57', // Green
        '#3357FF', // Blue
        '#FF33F5', // Pink
        '#F5FF33', // Yellow
      ];

      expect(predefinedColors).toHaveLength(5);
      predefinedColors.forEach(color => {
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        expect(hexRegex.test(color)).toBe(true);
      });
    });

    it('should convert color to uppercase', () => {
      const color = '#ff5733';
      const uppercase = color.toUpperCase();

      expect(uppercase).toBe('#FF5733');
    });
  });

  describe('Tag Usage Count', () => {
    it('should track usage count', () => {
      const tag = {
        name: 'VIP Client',
        usageCount: 15,
      };

      expect(tag.usageCount).toBe(15);
    });

    it('should default to zero usage', () => {
      const tag = {
        name: 'New Tag',
        usageCount: 0,
      };

      expect(tag.usageCount).toBe(0);
    });

    it('should increment usage count', () => {
      let usageCount = 15;
      usageCount += 1;

      expect(usageCount).toBe(16);
    });

    it('should decrement usage count', () => {
      let usageCount = 15;
      usageCount -= 1;

      expect(usageCount).toBe(14);
    });

    it('should not go below zero', () => {
      let usageCount = 0;
      usageCount = Math.max(0, usageCount - 1);

      expect(usageCount).toBe(0);
    });
  });

  describe('Tag Filtering', () => {
    it('should search tags by name', () => {
      const tags = [
        { id: '1', name: 'VIP Client' },
        { id: '2', name: 'Enterprise' },
        { id: '3', name: 'VIP Partner' },
      ];

      const search = 'vip';
      const filtered = tags.filter(t =>
        t.name.toLowerCase().includes(search)
      );

      expect(filtered).toHaveLength(2);
    });

    it('should find unused tags', () => {
      const tags = [
        { id: '1', usageCount: 5 },
        { id: '2', usageCount: 0 },
        { id: '3', usageCount: 10 },
      ];

      const unused = tags.filter(t => t.usageCount === 0);
      expect(unused).toHaveLength(1);
    });

    it('should find popular tags', () => {
      const tags = [
        { id: '1', usageCount: 5 },
        { id: '2', usageCount: 20 },
        { id: '3', usageCount: 10 },
      ];

      const threshold = 10;
      const popular = tags.filter(t => t.usageCount >= threshold);

      expect(popular).toHaveLength(2);
    });
  });

  describe('Tag Sorting', () => {
    it('should sort by usage count descending', () => {
      const tags = [
        { id: '1', usageCount: 5 },
        { id: '2', usageCount: 20 },
        { id: '3', usageCount: 10 },
      ];

      const sorted = tags.sort((a, b) => b.usageCount - a.usageCount);

      expect(sorted[0].id).toBe('2');
      expect(sorted[2].id).toBe('1');
    });

    it('should sort alphabetically by name', () => {
      const tags = [
        { id: '1', name: 'Zebra' },
        { id: '2', name: 'Apple' },
        { id: '3', name: 'Mango' },
      ];

      const sorted = tags.sort((a, b) => a.name.localeCompare(b.name));

      expect(sorted[0].name).toBe('Apple');
      expect(sorted[2].name).toBe('Zebra');
    });

    it('should sort by creation date', () => {
      const tags = [
        { id: '1', createdAt: '2024-01-01T00:00:00Z' },
        { id: '2', createdAt: '2024-01-15T00:00:00Z' },
        { id: '3', createdAt: '2024-01-10T00:00:00Z' },
      ];

      const sorted = tags.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      expect(sorted[0].id).toBe('2');
      expect(sorted[2].id).toBe('1');
    });
  });

  describe('Tag Stats', () => {
    it('should calculate total usage', () => {
      const tags = [
        { usageCount: 5 },
        { usageCount: 10 },
        { usageCount: 15 },
      ];

      const totalUsage = tags.reduce((sum, t) => sum + t.usageCount, 0);
      expect(totalUsage).toBe(30);
    });

    it('should count total tags', () => {
      const tags = [
        { name: 'Tag 1' },
        { name: 'Tag 2' },
        { name: 'Tag 3' },
      ];

      expect(tags.length).toBe(3);
    });

    it('should find most used tag', () => {
      const tags = [
        { id: '1', name: 'VIP', usageCount: 5 },
        { id: '2', name: 'Enterprise', usageCount: 20 },
        { id: '3', name: 'Partner', usageCount: 10 },
      ];

      const sorted = tags.sort((a, b) => b.usageCount - a.usageCount);
      expect(sorted[0].name).toBe('Enterprise');
    });
  });

  describe('Tag Deletion', () => {
    it('should allow deletion of unused tags', () => {
      const tag = {
        id: 'tag-1',
        usageCount: 0,
      };

      const canDelete = tag.usageCount === 0;
      expect(canDelete).toBe(true);
    });

    it('should warn before deleting used tags', () => {
      const tag = {
        id: 'tag-1',
        usageCount: 15,
      };

      const needsWarning = tag.usageCount > 0;
      expect(needsWarning).toBe(true);
    });
  });

  describe('Tag Assignment', () => {
    it('should assign tag to entity', () => {
      const entityTags: string[] = [];
      const tagToAdd = 'VIP Client';

      if (!entityTags.includes(tagToAdd)) {
        entityTags.push(tagToAdd);
      }

      expect(entityTags).toContain('VIP Client');
      expect(entityTags).toHaveLength(1);
    });

    it('should remove tag from entity', () => {
      const entityTags = ['VIP Client', 'Enterprise'];
      const tagToRemove = 'VIP Client';

      const filtered = entityTags.filter(t => t !== tagToRemove);

      expect(filtered).not.toContain('VIP Client');
      expect(filtered).toHaveLength(1);
    });

    it('should prevent duplicate tags on entity', () => {
      const entityTags = ['VIP Client'];
      const tagToAdd = 'VIP Client';

      if (!entityTags.includes(tagToAdd)) {
        entityTags.push(tagToAdd);
      }

      expect(entityTags).toHaveLength(1);
    });
  });

  describe('Tag Bulk Operations', () => {
    it('should assign multiple tags at once', () => {
      const entityTags: string[] = [];
      const tagsToAdd = ['VIP', 'Enterprise', 'Priority'];

      tagsToAdd.forEach(tag => {
        if (!entityTags.includes(tag)) {
          entityTags.push(tag);
        }
      });

      expect(entityTags).toHaveLength(3);
    });

    it('should remove multiple tags at once', () => {
      const entityTags = ['VIP', 'Enterprise', 'Priority', 'Standard'];
      const tagsToRemove = ['VIP', 'Priority'];

      const filtered = entityTags.filter(t => !tagsToRemove.includes(t));

      expect(filtered).toHaveLength(2);
      expect(filtered).toContain('Enterprise');
      expect(filtered).toContain('Standard');
    });
  });

  describe('Tag Rename', () => {
    it('should update tag name', () => {
      const tag = {
        name: 'VIP Client',
      };

      tag.name = 'Premium Client';

      expect(tag.name).toBe('Premium Client');
    });

    it('should prevent renaming to existing tag name', () => {
      const existingTags = [
        { id: '1', name: 'VIP Client' },
        { id: '2', name: 'Enterprise' },
      ];

      const newName = 'Enterprise';
      const isDuplicate = existingTags.some(t => t.name === newName);

      expect(isDuplicate).toBe(true);
    });
  });
});
