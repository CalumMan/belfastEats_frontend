import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css',
})
export class Navigation {
  isMenuOpen = false;

  constructor(public auth: AuthService, private router: Router) {}

  logout() {
    this.isMenuOpen = false;
    this.auth.logout();
    this.router.navigate(['/']);
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}
