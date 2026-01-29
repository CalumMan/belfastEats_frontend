import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebService {
  private baseUrl = 'http://127.0.0.1:5000/api/v1.0';

  constructor(private http: HttpClient) {}

  // GET all businesses
  getBusinesses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/businesses`);
  }

  // GET a single business
  getBusiness(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/businesses/${id}`);
  }

  // GET all reviews for a business
  getReviews(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/businesses/${id}/reviews`);
  }

  // POST a new review
  postReview(id: string, review: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/businesses/${id}/reviews`, review);
  }
}
