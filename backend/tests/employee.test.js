const request = require('supertest');
const app = require('../app/app');

describe('Employee API', () => {
  test('GET /api/employee should return employees', async () => {
    const response = await request(app)
      .get('/api/employee')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/employee should create employee', async () => {
    const newEmployee = {
      name: 'Test Employee',
      email: 'test@example.com',
      role: 'Developer',
      department: 'Engineering'
    };

    const response = await request(app)
      .post('/api/employee')
      .send(newEmployee)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(newEmployee.name);
  });
});
