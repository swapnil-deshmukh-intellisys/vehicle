describe('Root Level Tests', () => {
  test('Jest is working', () => {
    expect(true).toBe(true);
  });

  test('Test framework detection', () => {
    expect(typeof jest).toBeDefined();
  });

  test('Basic functionality', () => {
    expect(1 + 1).toBe(2);
  });
});
