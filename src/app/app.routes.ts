import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Businesses } from './components/businesses/businesses';
import { Business } from './components/business/business';
import { Login } from './components/auth/login';
import { Register } from './components/auth/register';
import { MyReviews } from './components/my-reviews/my-reviews';
import { AdminBusinesses } from './components/admin-businesses/admin-businesses';
import { adminGuard } from './services/admin.guard';
import { Favourites } from './components/favourites/favourites';
import { AdminUsers } from './components/admin-users/admin-users';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'businesses', component: Businesses },
  { path: 'businesses/:id', component: Business },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'my-reviews', component: MyReviews },
  { path: 'favourites', component: Favourites },
  {
    path: 'admin/businesses',
    component: AdminBusinesses,
    canActivate: [adminGuard],
  },
  {
    path: 'admin/users',
    component: AdminUsers,
    canActivate: [adminGuard],
  },
];
