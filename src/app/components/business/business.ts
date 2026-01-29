import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';

// Google Maps script is loaded via index.html, so declare the global for TS.
declare const google: any;

// Minimal types to avoid depending on google.maps namespace typings
type LatLngLiteral = { lat: number; lng: number };
type MapOptions = { center?: LatLngLiteral; zoom?: number };
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { BusinessData } from '../../services/business-data';
import { ReviewData, Review } from '../../services/review-data';
import { AuthService } from '../../services/auth.service';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-business',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './business.html',
  styleUrl: './business.css',
})
export class Business implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;
  private viewReady = false;
  private pendingCenter: LatLngLiteral | null = null;
  private mapInitAttempts = 0;

  business_list: any[] = [];

  private readonly fallbackCenter: LatLngLiteral = {
    lat: 54.5973,
    lng: -5.9301,
  };

  map_options: MapOptions = {
    center: { ...this.fallbackCenter },
    zoom: 13,
  };
  marker_position: LatLngLiteral | null = null;

  // Reviews
  reviews: Review[] = [];
  reviewForm!: FormGroup;
  submittingReview = false;
  loadingReviews = false;
  reviewsError: string | null = null;
  favMessage: string | null = null;
  isFavorite = false;

  businessId: string | null = null;

  constructor(
    private businessData: BusinessData,
    private reviewData: ReviewData,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    public auth: AuthService,
    private cdr: ChangeDetectorRef,
    private favorites: FavoritesService
  ) {}

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.pendingCenter) {
      this.renderMap(this.pendingCenter.lat, this.pendingCenter.lng);
      this.pendingCenter = null;
    }
  }

  ngOnInit() {
    // React to route changes
    this.route.paramMap.subscribe((params) => {
      this.businessId = params.get('id');

      if (!this.businessId) {
        console.warn('[Business] No id in route');
        return;
      }

      // reset map while loading new business
      this.marker_position = null;
      this.map_options = {
        center: { ...this.fallbackCenter },
        zoom: 13,
      };

      // try to get from already loaded data
      this.business_list = this.businessData.getBusiness(this.businessId);

      if (!this.business_list.length) {
        // fallback: load all then pick one
        this.businessData.loadBusinesses().subscribe(() => {
          this.business_list = this.businessData.getBusiness(this.businessId!);
          this.setupBusinessAndMap();
        });
      } else {
        this.setupBusinessAndMap();
      }

      // refresh reviews for this business
      if (this.businessId) {
        this.loadReviews(this.businessId);
      }
    });

    // build review form once
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.maxLength(500)]],
      title: ['', [Validators.maxLength(120)]],
    });
  }

  private setupBusinessAndMap() {
    const business = this.business_list[0];
    if (!business) {
      console.warn('[Business] No business found for id', this.businessId);
      return;
    }
    this.isFavorite = !!(business._id && this.favorites.isFavorite(business._id));

    // Prefer normalised lat/lng, but also support raw latitude/longitude from API/DB
    const lat = Number(
      business.lat ??
      business.latitude ??
      54.5973
    );
    const lng = Number(
      business.lng ??
      business.longitude ??
      -5.9301
    );

    console.log('[MAP]', {
      id: this.businessId,
      name: business.name,
      lat,
      lng,
    });

    this.map_options = {
      center: { lat, lng },
      zoom: 15,
    };

    this.marker_position = { lat, lng };

    console.log('[MAP] set marker_position', this.marker_position);

    this.renderMap(lat, lng);

    if (this.businessId) {
      this.loadReviews(this.businessId);
    }
  }

  addFavorite() {
    if (!this.businessId || this.auth.isAdmin()) return;
    const biz = this.business_list[0];
    if (!biz) return;
    this.favorites.add({
      id: this.businessId,
      name: biz.name || 'Unnamed business',
      address: biz.address,
      postcode: biz.postcode,
      hygiene_rating: biz.hygiene_rating,
    });
    this.isFavorite = true;
    this.favMessage = 'Added to favourites';
  }

  private loadReviews(businessId: string) {
    this.loadingReviews = true;
    this.reviewsError = null;

    console.log('[Reviews] loading for business', businessId);

    this.reviewData
      .getReviewsForBusiness(businessId)
      .pipe(
        finalize(() => (this.loadingReviews = false))
      )
      .subscribe({
        next: (reviews) => {
          const currentUserId = this.auth.getCurrentUser()?.id;
          this.reviews = reviews
            .map((r) => ({
              ...r,
              author: currentUserId && r.userId === currentUserId ? 'You' : (r.author || 'Anonymous'),
              title: r.title ?? '',
            }))
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

          console.log('[Reviews] loaded', this.reviews.length);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.reviewsError =
            err?.error?.error || 'Could not load reviews right now.';
          console.error('[Reviews] load error', err);
          this.reviews = [];
          this.cdr.detectChanges();
        },
      });
  }

  private renderMap(lat: number, lng: number) {
    if (!this.viewReady) {
      this.pendingCenter = { lat, lng };
      return;
    }
    if (!this.mapContainer?.nativeElement) {
      console.warn('[MAP] mapContainer missing');
      return;
    }
    if (!(window as any)?.google?.maps) {
      this.mapInitAttempts++;
      if (this.mapInitAttempts <= 20) {
        // retry until script loads (up to ~5s)
        setTimeout(() => this.renderMap(lat, lng), 250);
      } else {
        console.warn('[MAP] google maps script not loaded after retries');
      }
      return;
    }

    this.mapInitAttempts = 0;

    const map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: { lat, lng },
      zoom: 15,
    });

    new google.maps.Marker({
      position: { lat, lng },
      map,
    });
  }

  // Convenience getters for template
  get title() {
    return this.reviewForm.get('title');
  }

  get rating() {
    return this.reviewForm.get('rating');
  }

  get comment() {
    return this.reviewForm.get('comment');
  }

  onSubmitReview() {
    if (!this.businessId || this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.submittingReview = true;

    const { rating, comment, title } = this.reviewForm.value;

    this.reviewData
      .addReview(this.businessId, rating, comment, title)
      .subscribe({
        next: () => {
          this.submittingReview = false;
          this.reviewForm.reset({
            rating: 5,
            comment: '',
            title: '',
          });
          this.loadReviews(this.businessId!);
        },
        error: (err) => {
          this.submittingReview = false;
          this.reviewsError =
            err?.error?.error ||
            'Could not submit your review. Please try again.';
          console.error('[Reviews] submit error', err);
        },
      });
  }

  trackById(index: number, item: any) {
    return item?._id || index;
  }

  ratingStars(value: any): any[] {
    const n = Math.max(0, Math.min(5, Number(value) || 0));
    return Array.from({ length: n });
  }
}
