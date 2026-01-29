import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, switchMap } from 'rxjs';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role?: string;
}

interface LoginResponse {
  access_token: string;
  user_id: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:5000/api/v1.0/auth';
  private tokenKey = 'be_token';
  private userKey = 'be_user';

  constructor(private http: HttpClient) {}

  // ----- LOGIN -----
  // Backend expects: { email, password }
  login(email: string, password: string): Observable<void> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        // store token
        tap((res) => this.setToken(res.access_token)),
        // fetch full user from /me using the new token
        switchMap(() => this.fetchAndStoreUser()),
        // we don't need to return the user from login() itself
        map(() => void 0)
      );
  }

  // ----- REGISTER -----
  // Backend expects: { email, password, username?, role?, invite_code? }
  // For now we send email/password/username and then auto-login.
  register(email: string, password: string, username?: string): Observable<void> {
    return this.http
      .post(`${this.apiUrl}/register`, {
        email,
        password,
        username,
      })
      .pipe(
        // After successful registration, log in with same credentials
        switchMap(() => this.login(email, password))
      );
  }

  // ----- LOGOUT -----
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // ----- STATE HELPERS -----
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  // ----- INTERNAL -----

  private setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  private setUser(user: AuthUser) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Calls /auth/me to get full user info and stores it
  private fetchAndStoreUser(): Observable<AuthUser> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      map((res) => {
        const user: AuthUser = {
          id: res._id,
          username: res.username,
          email: res.email,
          role: res.role,
        };
        return user;
      }),
      tap((user) => this.setUser(user))
    );
  }
}
