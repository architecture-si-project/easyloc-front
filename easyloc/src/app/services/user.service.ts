import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { API_BASE_URLS } from '../core/api.config';

export interface UserResponse {
  id: number;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly http: HttpClient) {}

  getUserById(userId: number): Observable<UserResponse> {
    const urls = [
      `${API_BASE_URLS.user}/users/${userId}`,
      `${API_BASE_URLS.user}/${userId}`,
    ];

    const requests = urls.map((url) =>
      this.http.get<unknown>(url).pipe(
        map((payload) => this.normalizeUserPayload(payload, userId)),
        catchError(() => of<UserResponse>({ id: userId })),
      ),
    );

    return forkJoin(requests).pipe(
      map((candidates) => candidates.find((candidate) => !!candidate.email) || candidates[0] || { id: userId }),
    );
  }

  private normalizeUserPayload(payload: unknown, fallbackId: number): UserResponse {
    const asObject = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
    const nestedData = this.asRecord(asObject['data']);
    const nestedUser = this.asRecord(asObject['user']);

    const idCandidate = asObject['id'] ?? nestedData['id'] ?? nestedUser['id'];
    const parsedId = Number(idCandidate);
    const id = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : fallbackId;

    const email = this.extractEmail(asObject, nestedData, nestedUser);
    return email ? { id, email } : { id };
  }

  private extractEmail(...sources: Array<Record<string, unknown>>): string | undefined {
    for (const source of sources) {
      const value = source['email'];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return undefined;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }
}
