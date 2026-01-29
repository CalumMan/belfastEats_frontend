import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

import { Businesses } from './businesses';
import { BusinessData } from '../../services/business-data';

describe('Businesses component', () => {
  let component: Businesses;
  let fixture: any;

  const items = [
    { _id: '1', name: 'Alpha Cafe', hygiene_rating: 3 },
    { _id: '2', name: 'Mama Pizza', hygiene_rating: 5 },
    { _id: '3', name: 'Zeta Grill', hygiene_rating: 4 },
  ];

  const mockService = {
    loadBusinesses: () => of(items),
    getSource: () => 'api',
  } as unknown as BusinessData;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Businesses, RouterTestingModule],
      providers: [{ provide: BusinessData, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Businesses);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates and shows businesses from service', () => {
    expect(component.business_page.length).toBe(items.length);

    fixture.detectChanges();
    const cards = fixture.debugElement.queryAll(By.css('.business-card'));
    expect(cards.length).toBe(items.length);
  });

  it('filters by search term', () => {
    component.all_businesses = items;
    component.searchTerm = 'mama';
    component.applyFilters();

    expect(component.filtered_businesses.length).toBe(1);
    expect(component.filtered_businesses[0].name).toContain('Mama');
  });

  it('sorts by name A -> Z', () => {
    const unsorted = [
      { _id: 'a', name: 'Zed' },
      { _id: 'b', name: 'Alpha' },
      { _id: 'c', name: 'Mike' },
    ];
    component.all_businesses = unsorted;
    component.sortOption = 'name-asc';

    component.applyFilters();

    const names = component.filtered_businesses.map((b) => b.name);
    expect(names).toEqual(['Alpha', 'Mike', 'Zed']);
  });
});
