import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms';

import { Business } from './business';
import { BusinessData } from '../../services/business-data';
import { ReviewData } from '../../services/review-data';
import { AuthService } from '../../services/auth.service';

describe('Business component', () => {
  const mockBusiness = {
    _id: 'b1',
    name: 'Test Biz',
    lat: 10,
    lng: 20,
  };

  const businessDataMock = {
    getBusiness: () => [mockBusiness],
    loadBusinesses: () => of([mockBusiness]),
  } as unknown as BusinessData;

  const reviewsMock = [
    {
      id: 'r1',
      businessId: 'b1',
      author: 'Alice',
      rating: 4,
      comment: 'Nice',
      createdAt: new Date().toISOString(),
    },
  ];

  const reviewDataMock = {
    getReviewsForBusiness: () => of(reviewsMock),
    addReview: () => of(reviewsMock[0]),
  } as unknown as ReviewData;

  const authMock = {
    isLoggedIn: () => true,
    isAdmin: () => false,
    getCurrentUser: () => ({ id: 'u1', username: 'test' }),
  } as unknown as AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Business, RouterTestingModule, ReactiveFormsModule],
      providers: [
        { provide: BusinessData, useValue: businessDataMock },
        { provide: ReviewData, useValue: reviewDataMock },
        { provide: AuthService, useValue: authMock },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'b1' })),
          },
        },
      ],
    }).compileComponents();
  });

  it('loads business and sets map options', () => {
    const fixture = TestBed.createComponent(Business);
    const component = fixture.componentInstance;
    // avoid hitting real maps
    (component as any).renderMap = () => {};
    if (!component.reviewForm) {
      component.reviewForm = new FormBuilder().group({
        rating: [5],
        comment: [''],
        title: [''],
      });
    }
    fixture.detectChanges();

    expect(component.map_options.center?.lat).toBe(10);
    expect(component.map_options.center?.lng).toBe(20);
    expect(component.marker_position).toEqual({ lat: 10, lng: 20 });
  });

  it('loads reviews from service', () => {
    const fixture = TestBed.createComponent(Business);
    const component = fixture.componentInstance;
    (component as any).renderMap = () => {};
    if (!component.reviewForm) {
      component.reviewForm = new FormBuilder().group({
        rating: [5],
        comment: [''],
        title: [''],
      });
    }
    fixture.detectChanges();

    expect(component.reviews.length).toBe(reviewsMock.length);
  });

  it('hides form for logged out users', () => {
    const fixture = TestBed.overrideProvider(AuthService, {
      useValue: {
        isLoggedIn: () => false,
        isAdmin: () => false,
        getCurrentUser: () => null,
      },
    }).createComponent(Business);

    const component = fixture.componentInstance;
    (component as any).renderMap = () => {};
    if (!component.reviewForm) {
      component.reviewForm = new FormBuilder().group({
        rating: [5],
        comment: [''],
        title: [''],
      });
    }
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form');
    expect(form).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Please log in to leave a review'
    );
  });
});
