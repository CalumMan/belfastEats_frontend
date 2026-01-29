import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { Login } from './login';
import { AuthService } from '../../services/auth.service';

describe('Login component', () => {
  let authMock: { login: (email: string, password: string) => any; calls: any[] };

  beforeEach(async () => {
    authMock = {
      calls: [],
      login: (email: string, password: string) => {
        authMock.calls.push([email, password]);
        return of(void 0);
      },
    };

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authMock }],
    }).compileComponents();
  });

  it('shows validation errors when submitted empty', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;

    component.onSubmit();
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Valid email is required');
    expect(text).toContain('Password is required');
  });

  it('calls AuthService.login with form values', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;

    component.form.setValue({
      email: 'test@example.com',
      password: 'secret1',
    });

    component.onSubmit();

    expect(authMock.calls.length).toBe(1);
    expect(authMock.calls[0]).toEqual(['test@example.com', 'secret1']);
  });
});
