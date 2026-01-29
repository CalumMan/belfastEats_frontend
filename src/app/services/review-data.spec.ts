import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ReviewData } from './review-data';

describe('ReviewData', () => {
  let service: ReviewData;
  let http: HttpTestingController;
  const baseUrl = 'http://127.0.0.1:5000/api/v1.0/reviews';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReviewData],
    });

    service = TestBed.inject(ReviewData);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('getReviews maps backend fields into Review model', () => {
    const mockApi = [
      {
        _id: 'r1',
        restaurant_id: 'b1',
        user_id: 'u1',
        user_name: 'Alice',
        rating: 4,
        body: 'Nice spot',
        created_at: '2025-01-01T00:00:00Z',
      },
    ];
    let result: any[] | undefined;

    service.getReviewsForBusiness('b1').subscribe((reviews) => {
      result = reviews;
      expect(reviews.length).toBe(1);
      const r = reviews[0];
      expect(r.businessId).toBe('b1');
      expect(r.author).toBe('Alice');
      expect(r.comment).toBe('Nice spot');
      expect(r.rating).toBe(4);
    });

    const req = http.expectOne(`${baseUrl}/restaurant/b1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockApi);

    expect(result).toBeDefined();
  });

  it('addReview sends correct payload and maps response', () => {
    const payload = { rating: 5, title: 'Great', body: 'Loved it' };
    const apiResponse = {
      _id: 'r2',
      restaurant_id: 'b2',
      user_id: 'u2',
      user_name: 'Bob',
      rating: 5,
      body: 'Loved it',
      title: 'Great',
      created_at: '2025-02-01T00:00:00Z',
    };
    let result: any;

    service.addReview('b2', payload.rating, payload.body, payload.title).subscribe((review) => {
      result = review;
      expect(review.businessId).toBe('b2');
      expect(review.author).toBe('Bob');
      expect(review.comment).toBe('Loved it');
      expect(review.rating).toBe(5);
    });

    const req = http.expectOne(`${baseUrl}/b2`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      rating: 5,
      title: 'Great',
      body: 'Loved it',
    });
    req.flush(apiResponse);

    expect(result).toBeDefined();
  });
});
