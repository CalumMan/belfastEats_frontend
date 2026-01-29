import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
})
export class Register {
  form: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  get email() {
    return this.form.get('email');
  }

  get username() {
    return this.form.get('username');
  }

  get password() {
    return this.form.get('password');
  }

  get confirmPassword() {
    return this.form.get('confirmPassword');
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.password?.value !== this.confirmPassword?.value) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.error = null;

    const { email, username, password } = this.form.value;

    this.auth.register(email, password, username).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/businesses']);
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.msg ||
          err?.error?.error ||
          'Registration failed. Please try again.';
        console.error('Register error', err);
      },
    });
  }
}
