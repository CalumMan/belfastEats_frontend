import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { MyReviews } from './my-reviews';
import { AuthService } from '../../services/auth.service';
import { ReviewData } from '../../services/review-data';

describe('MyReviews component', () => {
  const reviewsMock = [
    {
      id: 'r1',
      businessId: 'b1',
      restaurantName: 'Test Biz',
      author: 'me',
      rating: 4,
      comment: 'Nice',
      createdAt: new Date().toISOString(),
    },
  ];

  const reviewServiceMock = {
    getMyReviews: () => of(reviewsMock),
  } as unknown as ReviewData;

  it('shows login prompt when logged out', async () => {
    await TestBed.configureTestingModule({
      imports: [MyReviews, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: () => false } },
        { provide: ReviewData, useValue: reviewServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MyReviews);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Please log in to view your reviews.');
    const cards = fixture.nativeElement.querySelectorAll('.card');
    expect(cards.length).toBe(0);
  });

  it('loads and renders user reviews when logged in', async () => {
    await TestBed.configureTestingModule({
      imports: [MyReviews, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { isLoggedIn: () => true } },
        { provide: ReviewData, useValue: reviewServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MyReviews);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.reviews.length).toBe(1);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Test Biz');
    expect(text).toContain('Nice');
  });
});
