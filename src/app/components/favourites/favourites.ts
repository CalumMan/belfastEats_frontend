import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesService, FavoriteBusiness } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favourites.html',
})
export class Favourites implements OnInit {
  favs: FavoriteBusiness[] = [];

  constructor(public auth: AuthService, private favorites: FavoritesService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.favs = this.favorites.getAll();
  }

  remove(id: string) {
    this.favorites.remove(id);
    this.load();
  }
}
