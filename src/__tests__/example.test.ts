import { describe, it, expect } from '@jest/globals';

describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('should perform basic arithmetic', () => {
    const sum = 2 + 2;
    expect(sum).toBe(4);
  });

  it('should handle string operations', () => {
    const greeting = 'Hello, World!';
    expect(greeting).toContain('World');
    expect(greeting.length).toBeGreaterThan(0);
  });

  it('should work with arrays', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
  });

  it('should work with objects', () => {
    const user = { id: 1, name: 'Test User', email: 'test@example.com' };
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user.email).toBe('test@example.com');
  });
});
