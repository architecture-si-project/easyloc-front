import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URLS } from '../core/api.config';
import { EntityId, Housing, HousingSearchFilters } from '../core/models/housing.model';

@Injectable({ providedIn: 'root' })
export class HousingService {
  private readonly baseUrl = `${API_BASE_URLS.housing}/housing`;

  constructor(private readonly http: HttpClient) {}

  getAllHousings(): Observable<Housing[]> {
    return this.http.get<Housing[]>(this.baseUrl, { headers: this.getAuthHeaders() });
  }

  searchHousings(filters: HousingSearchFilters): Observable<Housing[]> {
    let params = new HttpParams();

    if (filters.location?.trim()) {
      params = params.set('location', filters.location.trim());
    }

    if (filters.property_type?.trim()) {
      params = params.set('property_type', filters.property_type.trim());
    }

    if (typeof filters.price_max === 'number' && Number.isFinite(filters.price_max)) {
      params = params.set('price_max', String(filters.price_max));
    }

    if (typeof filters.available === 'boolean') {
      params = params.set('available', String(filters.available));
    }

    return this.http.get<Housing[]>(`${this.baseUrl}/search`, {
      params,
      headers: this.getAuthHeaders(),
    });
  }

  getHousingById(housingId: EntityId): Observable<Housing> {
    return this.http.get<Housing>(`${this.baseUrl}/${housingId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateHousing(housingId: EntityId, data: any): Observable<Housing> {
    return this.http.put<Housing>(`${this.baseUrl}/${housingId}`, data, {
      headers: this.getJsonHeaders(),
    });
  }

  getUserHousing(): Observable<Housing[]> {
    return this.http.get<Housing[]>(`${this.baseUrl}/mine`, {
      headers: this.getAuthHeaders(),
    });
  }

  createHousing(data: any): Observable<Housing> {
    return this.http.post<Housing>(this.baseUrl, data, {
      headers: this.getJsonHeaders(),
    });
  }

  getAll(): Observable<Housing[]> {
    return this.getAllHousings();
  }

  getById(housingId: EntityId): Observable<Housing> {
    return this.getHousingById(housingId);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token')?.trim();

    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private getJsonHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token')?.trim();

    if (!token) {
      return new HttpHeaders({ 'Content-Type': 'application/json' });
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }
}