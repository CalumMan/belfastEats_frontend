import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const apiUrl = 'http://127.0.0.1:5000/api/v1.0/auth';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    localStorage.clear();
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
    http.verify();
  });

  it('login stores token and user and marks admin', () => {
    const token = 'test-token';
    const loginRes = { access_token: token, user_id: 'u1', role: 'admin' };
    const userRes = {
      _id: 'u1',
      username: 'adminUser',
      email: 'admin@test.com',
      role: 'admin',
    };
    let completed = false;

    service.login('admin@test.com', 'secret').subscribe(() => {
      completed = true;
      expect(service.getToken()).toBe(token);
      const user = service.getCurrentUser();
      expect(user?.id).toBe('u1');
      expect(user?.role).toBe('admin');
      expect(service.isLoggedIn()).toBe(true);
      expect(service.isAdmin()).toBe(true);
    });

    const loginReq = http.expectOne(`${apiUrl}/login`);
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush(loginRes);

    const meReq = http.expectOne(`${apiUrl}/me`);
    expect(meReq.request.method).toBe('GET');
    meReq.flush(userRes);

    expect(completed).toBe(true);
  });

  it('logout clears storage and logged-in state', () => {
    localStorage.setItem('be_token', 'abc');
    localStorage.setItem(
      'be_user',
      JSON.stringify({ id: '1', username: 'x', email: 'x@test.com' })
    );

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('isAdmin is false for non-admin user', () => {
    localStorage.setItem(
      'be_user',
      JSON.stringify({ id: '2', username: 'user', email: 'u@test.com', role: 'user' })
    );

    expect(service.isAdmin()).toBe(false);
  });
});
