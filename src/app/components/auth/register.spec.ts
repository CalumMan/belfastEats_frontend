import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { Register } from './register';
import { AuthService } from '../../services/auth.service';

describe('Register component', () => {
  let authMock: { register: (...args: any[]) => any; calls: any[] };

  beforeEach(async () => {
    authMock = {
      calls: [],
      register: (email: string, password: string, username?: string) => {
        authMock.calls.push([email, password, username]);
        return of(void 0);
      },
    };

    await TestBed.configureTestingModule({
      imports: [Register, ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authMock }],
    }).compileComponents();
  });

  it('shows error when passwords do not match', () => {
    const fixture = TestBed.createComponent(Register);
    const component = fixture.componentInstance;

    component.form.setValue({
      email: 'test@test.com',
      username: 'tester',
      password: 'secret1',
      confirmPassword: 'different',
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(component.error).toBe('Passwords do not match.');
    expect(authMock.calls.length).toBe(0);
  });

  it('calls AuthService.register with valid form', () => {
    const fixture = TestBed.createComponent(Register);
    const component = fixture.componentInstance;

    component.form.setValue({
      email: 'test@test.com',
      username: 'tester',
      password: 'secret1',
      confirmPassword: 'secret1',
    });

    component.onSubmit();

    expect(authMock.calls.length).toBe(1);
    expect(authMock.calls[0]).toEqual(['test@test.com', 'secret1', 'tester']);
  });
});
