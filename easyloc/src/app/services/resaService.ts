import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URLS } from '../core/api.config';
import { EntityId } from '../core/models/housing.model';
import {
  CreateReservationRequestPayload,
  CreateReservationRequestResponse,
  ReservationQueryFilters,
  ReservationRequest,
  UpdateReservationStatusPayload,
} from '../core/models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ResaService {
  private readonly requestsBaseUrl = `${API_BASE_URLS.reservation}/reservations/requests`;

  constructor(private readonly http: HttpClient) {}

  createReservationRequest(
    payload: CreateReservationRequestPayload,
  ): Observable<CreateReservationRequestResponse> {
    return this.http.post<CreateReservationRequestResponse>(this.requestsBaseUrl, payload, {
      headers: this.getJsonHeaders(),
    });
  }

  listReservationRequests(filters?: ReservationQueryFilters): Observable<ReservationRequest[]> {
    let params = new HttpParams();

    if (filters?.status?.trim()) {
      params = params.set('status', filters.status.trim());
    }

    if (typeof filters?.tenant_id === 'number' && Number.isFinite(filters.tenant_id)) {
      params = params.set('tenant_id', String(filters.tenant_id));
    }

    if (typeof filters?.housing_id === 'number' && Number.isFinite(filters.housing_id)) {
      params = params.set('housing_id', String(filters.housing_id));
    }

    return this.http.get<ReservationRequest[]>(this.requestsBaseUrl, {
      params,
      headers: this.getAuthHeaders(),
    });
  }

  listMyReservationRequests(filters?: Pick<ReservationQueryFilters, 'status'>): Observable<ReservationRequest[]> {
    let params = new HttpParams();

    if (filters?.status?.trim()) {
      params = params.set('status', filters.status.trim());
    }

    return this.http.get<ReservationRequest[]>(`${this.requestsBaseUrl}/me`, {
      params,
      headers: this.getAuthHeaders(),
    });
  }

  getReservationById(reservationId: EntityId): Observable<ReservationRequest> {
    return this.http.get<ReservationRequest>(`${this.requestsBaseUrl}/${reservationId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateReservationStatus(
    reservationId: EntityId,
    payload: UpdateReservationStatusPayload,
  ): Observable<ReservationRequest> {
    return this.http.patch<ReservationRequest>(`${this.requestsBaseUrl}/${reservationId}/status`, payload, {
      headers: this.getJsonHeaders(),
    });
  }

  getAll(): Observable<ReservationRequest[]> {
    return this.listReservationRequests();
  }

  getRequestById(reservationId: EntityId): Observable<ReservationRequest> {
    return this.getReservationById(reservationId);
  }

  getUserResa(): Observable<ReservationRequest[]> {
    return this.listMyReservationRequests();
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