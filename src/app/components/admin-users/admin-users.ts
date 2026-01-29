import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersDebugService, DebugUser } from '../../services/users-debug.service';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-users.html',
})
export class AdminUsers implements OnInit {
  users: DebugUser[] = [];
  editing: string | null = null;
  form!: FormGroup;
  info: string | null = null;

  constructor(
    private usersService: UsersDebugService,
    public auth: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['user', [Validators.required]],
    });
    this.load();
  }

  load() {
    this.users = this.usersService.list();
  }

  startEdit(user: DebugUser) {
    this.editing = user.id;
    this.form.setValue({
      username: user.username,
      email: user.email,
      role: user.role,
    });
    this.info = null;
  }

  cancel() {
    this.editing = null;
    this.form.reset({
      username: '',
      email: '',
      role: 'user',
    });
  }

  save() {
    if (!this.editing || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const updated = this.usersService.update(this.editing, this.form.value);
    this.info = updated ? 'User updated (debug only, local data)' : 'User not found';
    this.cancel();
    this.load();
  }

  remove(id: string) {
    this.usersService.delete(id);
    this.load();
  }
}
