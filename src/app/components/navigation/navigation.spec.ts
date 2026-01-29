import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

import { Navigation } from './navigation';
import { AuthService } from '../../services/auth.service';

describe('Navigation component', () => {
  const loggedOutAuth = {
    isLoggedIn: () => false,
    isAdmin: () => false,
    getCurrentUser: () => null,
    logout: () => {},
  } as unknown as AuthService;

  const loggedInAuth = {
    isLoggedIn: () => true,
    isAdmin: () => false,
    getCurrentUser: () => ({ username: 'test', email: 'test@test.com' }),
    logout: () => {},
  } as unknown as AuthService;

  it('shows login/register when logged out', async () => {
    await TestBed.configureTestingModule({
      imports: [Navigation, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: loggedOutAuth }],
    }).compileComponents();

    const fixture = TestBed.createComponent(Navigation);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Login');
    expect(text).toContain('Register');
    expect(text).not.toContain('Hello,');
    expect(text).not.toContain('Logout');
  });

  it('shows username and logout when logged in', async () => {
    await TestBed.configureTestingModule({
      imports: [Navigation, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: loggedInAuth }],
    }).compileComponents();

    const fixture = TestBed.createComponent(Navigation);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Hello, test');
    expect(text).toContain('Logout');
    const loginLink = fixture.debugElement.query(By.css('a[routerLink="/login"]'));
    expect(loginLink).toBeNull();
  });
});
