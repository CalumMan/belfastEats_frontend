import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { BusinessData } from './business-data';

describe('BusinessData', () => {
  let service: BusinessData;
  let http: HttpTestingController;

  const apiUrl = 'http://127.0.0.1:5000/api/v1.0/restaurants/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BusinessData],
    });

    service = TestBed.inject(BusinessData);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads businesses from API on success', () => {
    const mock = [
      { _id: '1', name: 'Alpha', address: 'A', postcode: 'BT1' },
      { _id: '2', name: 'Beta', address: 'B', postcode: 'BT2' },
    ];
    let result: any[] | undefined;

    service.loadBusinesses().subscribe((data) => {
      result = data;
      expect(data.length).toBe(mock.length);
      expect(data[0].name).toBe('Alpha');
      expect(service.getSource()).toBe('api');
    });

    const req = http.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    expect(result).toBeDefined();
  });

  it('falls back to local JSON when API fails', () => {
    let result: any[] | undefined;

    service.loadBusinesses().subscribe((data) => {
      result = data;
      expect(data.length).toBeGreaterThan(0);
      expect(service.getSource()).toBe('json');
    });

    const req = http.expectOne(apiUrl);
    req.error(new ProgressEvent('error'));

    expect(result).toBeDefined();
  });

  it('paginates businesses correctly', () => {
    const mock = [
      { _id: '1', name: 'One' },
      { _id: '2', name: 'Two' },
      { _id: '3', name: 'Three' },
      { _id: '4', name: 'Four' },
      { _id: '5', name: 'Five' },
    ];

    // seed cache directly
    (service as any).businesses = mock;
    service.pageSize = 2;

    const page1 = service.getBusinesses(1);
    const page2 = service.getBusinesses(2);
    const page3 = service.getBusinesses(3);

    expect(page1.map((b) => b._id)).toEqual(['1', '2']);
    expect(page2.map((b) => b._id)).toEqual(['3', '4']);
    expect(page3.map((b) => b._id)).toEqual(['5']);
    expect(service.getLastPageNumber()).toBe(3);
  });
});
