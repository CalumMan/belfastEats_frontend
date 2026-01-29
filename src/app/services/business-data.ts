import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import localData from '../../assets/businesses_with_coords.json';

@Injectable({
  providedIn: 'root',
})
export class BusinessData {
  // Trailing slash to match Flask route
  private apiUrl = 'http://127.0.0.1:5000/api/v1.0/restaurants/';

  private businesses: any[] = [];
  private source: 'api' | 'json' | 'none' = 'none';
  pageSize: number = 3;

  constructor(private http: HttpClient) {}

  /**
   * Load businesses from the API (first time) and cache them.
   * If the API fails, fall back to local JSON.
   */
  loadBusinesses(): Observable<any[]> {
    // If we already have data, just return it
    if (this.businesses.length) {
      return of(this.businesses);
    }

    return this.http.get<any[]>(this.apiUrl).pipe(
      map((apiData) => {
        console.log(
          '[BusinessData] Loaded restaurants from API:',
          apiData.length
        );

  const normalised = apiData.map((r: any) => ({
  _id: r._id ?? r.id ?? r.restaurant_id,
  name: r.name ?? r.BusinessName ?? 'Unknown name',
  address: r.address ?? r.AddressLine1 ?? '',
  postcode: r.postcode ?? r.PostCode ?? '',
  hygiene_rating: r.hygiene_rating ?? r.HygieneRating ?? r.rating ?? null,
  cuisine: r.cuisine ?? r.BusinessType ?? '',
  tags: r.tags ?? [],

  // Include coordinates when available
  lat: r.latitude ?? r.lat ?? null,
  lng: r.longitude ?? r.lng ?? null,

  ...r, // keep all original fields
}));


        this.businesses = normalised;
        this.source = 'api';
        return this.businesses;
      }),
      catchError((err) => {
        console.warn(
          '[BusinessData] API unreachable, using local JSON instead.',
          err
        );
        this.businesses = localData as any[];
        this.source = 'json';
        return of(this.businesses);
      })
    );
  }

  getSource() {
    return this.source;
  }

  getAllBusinesses() {
    return this.businesses;
  }

  getStats() {
    return this.http.get<{ restaurants_count: number; reviews_count: number; average_rating: number | null }>(
      `${this.apiUrl}stats`
    );
  }

  // Admin: create new business
  createBusiness(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload).pipe(
      tap((created) => {
        if (created) {
          this.businesses.unshift(created);
        }
      })
    );
  }

  // Admin: update business
  updateBusiness(id: string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}${id}`, payload).pipe(
      tap((updated) => {
        if (!updated) return;
        const idx = this.businesses.findIndex((b) => b._id === id);
        if (idx >= 0) {
          this.businesses[idx] = { ...this.businesses[idx], ...updated };
        }
      })
    );
  }

  // Admin: delete business
  deleteBusiness(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}`).pipe(
      tap(() => {
        this.businesses = this.businesses.filter((b) => b._id !== id);
      })
    );
  }

  getBusiness(id: string) {
    return this.businesses.filter((b) => b._id === id);
  }

  getBusinesses(page: number) {
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.businesses.slice(start, end);
  }

  getLastPageNumber() {
    return Math.ceil(this.businesses.length / this.pageSize);
  }
}
