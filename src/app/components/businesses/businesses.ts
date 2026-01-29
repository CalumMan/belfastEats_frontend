import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessData } from '../../services/business-data';

@Component({
  selector: 'app-businesses',
  standalone: true,
  providers: [],
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './businesses.html',
  styleUrl: './businesses.css',
})
export class Businesses implements OnInit {
  // All businesses (after API/JSON load)
  all_businesses: any[] = [];

  // After search/filter/sort, before paging
  filtered_businesses: any[] = [];

  // The slice for the current page (what the template renders)
  business_page: any[] = [];

  // Pagination
  page: number = 1;
  pageSize: number = 6;
  totalPages: number = 1;

  // Search / filter / sort state
  searchTerm: string = '';
  minRating: number = 0;
  sortOption: string = 'name-asc';

  // Data source flag for the badge: 'api' | 'json' | 'none'
  dataSource: 'api' | 'json' | 'none' = 'none';
  private initialMinRating: number | null = null;

  constructor(public businessData: BusinessData, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.page = 1;
    this.setPageSizeForViewport();

    this.route.queryParamMap.subscribe((params) => {
      const min = Number(params.get('minRating'));
      if (!isNaN(min) && min > 0) {
        this.initialMinRating = min;
      }
    });

    this.dataSource = 'none';

    // Load from API (or JSON fallback) then apply filters
    this.businessData.loadBusinesses().subscribe((data) => {
      this.all_businesses = data;
      this.dataSource = this.businessData.getSource();

      if (this.initialMinRating !== null) {
        this.minRating = this.initialMinRating;
      }

      console.log(
        '[Businesses] loaded',
        this.all_businesses.length,
        'records from',
        this.dataSource
      );

      this.applyFilters(true);
    });
  }

  @HostListener('window:resize')
  onResize() {
    const prev = this.pageSize;
    this.setPageSizeForViewport();
    if (this.pageSize !== prev) {
      this.applyFilters(true);
    }
  }

  private setPageSizeForViewport() {
    const width = window.innerWidth;
    if (width >= 1200) {
      this.pageSize = 6; // show 6 cards on wide screens
    } else {
      this.pageSize = 3; // show 3 cards on narrower screens
    }
  }

  applyFilters(resetPage: boolean = true): void {
    let results = [...this.all_businesses];

    const term = this.searchTerm.trim().toLowerCase();
    if (term.length > 0) {
      results = results.filter((biz: any) =>
        (biz.name ?? '').toLowerCase().includes(term) ||
        (biz.address ?? '').toLowerCase().includes(term) ||
        (biz.postcode ?? '').toLowerCase().includes(term)
      );
    }

    if (this.minRating > 0) {
      results = results.filter(
        (biz: any) => (biz.hygiene_rating ?? 0) >= this.minRating
      );
    }

    switch (this.sortOption) {
      case 'name-asc':
        results.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
        break;
      case 'name-desc':
        results.sort((a, b) => (b.name ?? '').localeCompare(a.name ?? ''));
        break;
      case 'rating-desc':
        results.sort(
          (a, b) => (b.hygiene_rating ?? 0) - (a.hygiene_rating ?? 0)
        );
        break;
      case 'rating-asc':
        results.sort(
          (a, b) => (a.hygiene_rating ?? 0) - (b.hygiene_rating ?? 0)
        );
        break;
    }

    this.filtered_businesses = results;

    this.totalPages = Math.max(
      1,
      Math.ceil(this.filtered_businesses.length / this.pageSize)
    );

    if (resetPage || this.page > this.totalPages) {
      this.page = 1;
    }

    this.updatePageSlice();
  }

  private updatePageSlice(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.business_page = this.filtered_businesses.slice(start, end);
    sessionStorage['page'] = String(this.page);
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page = this.page - 1;
      this.updatePageSlice();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page = this.page + 1;
      this.updatePageSlice();
    }
  }

  trackById(index: number, item: any) {
    return item?._id || index;
  }

  ratingStars(biz: any): any[] {
    const n = Math.max(0, Math.min(5, Number(biz?.hygiene_rating) || 0));
    return Array.from({ length: n });
  }

  cuisineInfo(biz: any) {
    const cuisine = (biz?.cuisine || '').toLowerCase();
    const map: Record<string, { emoji: string; desc: string }> = {
      italian: { emoji: '🍕', desc: 'Hand-tossed pizzas and classic pastas.' },
      chinese: { emoji: '🥡', desc: 'Wok-fresh stir fries and noodles.' },
      indian: { emoji: '🍛', desc: 'Spiced curries and tandoori favorites.' },
      japanese: { emoji: '🍣', desc: 'Sushi rolls and comforting ramen.' },
      burgers: { emoji: '🍔', desc: 'Stacked burgers with crispy sides.' },
      kebab: { emoji: '🥙', desc: 'Grilled skewers and wraps to go.' },
      cafe: { emoji: '☕', desc: 'Coffee, bakes, and cozy bites.' },
      'fish & chips': { emoji: '🐟', desc: 'Golden fish with chunky chips.' },
      bakery: { emoji: '🥐', desc: 'Fresh bakes and sweet treats daily.' },
      british: { emoji: '🥧', desc: 'Comforting British classics.' },
    };

    const key = Object.keys(map).find((k) => cuisine.includes(k));
    const fallback = { emoji: '🍽️', desc: 'Tasty plates and friendly service.' };
    return key ? map[key] : fallback;
  }
}
