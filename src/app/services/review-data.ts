import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Public shape used by the UI
export interface Review {
  id: string;
  businessId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
  title?: string;
  userId?: string;
  restaurantName?: string;
}

// API response shape from Flask
interface ApiReview {
  _id: string;
  restaurant_id: string;
  user_id: string;
  user_name?: string;
  restaurant_name?: string;
  rating: number;
  title?: string;
  body?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewData {
  private apiUrl = 'http://127.0.0.1:5000/api/v1.0/reviews';

  constructor(private http: HttpClient) {}

  getReviewsForBusiness(businessId: string): Observable<Review[]> {
    return this.http
      .get<ApiReview[]>(`${this.apiUrl}/restaurant/${businessId}`)
      .pipe(map((list) => list.map((r) => this.mapReview(r))));
  }

  addReview(
    businessId: string,
    rating: number,
    comment: string,
    title?: string
  ): Observable<Review> {
    return this.http
      .post<ApiReview>(`${this.apiUrl}/${businessId}`, {
        rating,
        title: title ?? '',
        body: comment ?? '',
      })
      .pipe(map((r) => this.mapReview(r)));
  }

  updateReview(
    reviewId: string,
    rating: number,
    comment: string,
    title?: string
  ): Observable<Partial<Review>> {
    return this.http.put(`${this.apiUrl}/${reviewId}`, {
      rating,
      body: comment,
      title,
    }).pipe(map(() => ({
      rating,
      comment,
      title,
    })));
  }

  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${reviewId}`);
  }

  getMyReviews(): Observable<Review[]> {
    return this.http
      .get<ApiReview[]>(`${this.apiUrl}/me`)
      .pipe(map((list) => list.map((r) => this.mapReview(r))));
  }

  private mapReview(api: ApiReview): Review {
    const created =
      api.updated_at ??
      api.created_at ??
      new Date().toISOString();

    return {
      id: api._id,
      businessId: api.restaurant_id,
      author: api.user_name ?? api.user_id ?? 'Unknown user',
      restaurantName: api.restaurant_name,
      userId: api.user_id,
      rating: api.rating,
      title: api.title ?? '',
      comment: api.body ?? api.title ?? '',
      createdAt: created,
    };
  }
}
