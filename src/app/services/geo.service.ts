import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map, catchError, of } from "rxjs";

type LatLngLiteral = { lat: number; lng: number };

// Response shape from api.postcodes.io
interface PostcodeApiResponse {
  status: number;
  result: {
    latitude: number;
    longitude: number;
  } | null;
}

@Injectable({
  providedIn: "root",
})
export class GeoService {
  private apiUrl = "https://api.postcodes.io/postcodes";

  constructor(private http: HttpClient) {}

  geocode(postcode: string): Observable<LatLngLiteral | null> {
    const cleaned = postcode.trim();

    console.log("[GeoService] Geocoding postcode:", cleaned);

    return this.http
      .get<PostcodeApiResponse>(
        `${this.apiUrl}/${encodeURIComponent(cleaned)}`
      )
      .pipe(
        map((res) => {
          if (res.status !== 200 || !res.result) {
            console.warn("[GeoService] No result for postcode", cleaned);
            return null;
          }

          return {
            lat: res.result.latitude,
            lng: res.result.longitude,
          };
        }),
        catchError((err) => {
          console.error("[GeoService] Error calling postcodes.io", err);
          return of(null);
        })
      );
  }
}
