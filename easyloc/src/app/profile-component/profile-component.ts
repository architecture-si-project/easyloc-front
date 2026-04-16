import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HousingService } from '../services/HousingService';
import { ResaService } from '../services/resaService';

interface ReservationDisplay {
  id: number;
  title: string;
  dateRange: string;
  status: { value: string; label: string };
  notes?: string;
  housing_id?: number;
}

@Component({
  selector: 'app-profile-component',
  imports: [CommonModule],
  templateUrl: './profile-component.html',
  styleUrl: './profile-component.css',
})
export class ProfileComponent implements OnInit {
  userHousings: any[] = [];
  userReservations: ReservationDisplay[] = [];

  isLoadingHousings = true;
  isLoadingReservations = true;

  housingError = '';
  reservationError = '';

  private statusLabels: Record<string, string> = {
    pending: 'En attente',
    under_review: 'En cours d\'examen',
    approved: 'Approuvée',
    rejected: 'Rejetée',
    cancelled: 'Annulée',
  };

  constructor(
    private housingService: HousingService,
    private resaService: ResaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserHousings();
    this.loadUserReservations();
  }

  private loadUserHousings(): void {
    this.isLoadingHousings = true;
    this.housingError = '';

    this.housingService.getUserHousing().subscribe({
      next: (data) => {
        console.log('PROFILE HOUSING DATA:', data);
        this.userHousings = this.normalizeArray(data);
        this.isLoadingHousings = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('PROFILE HOUSING ERROR:', err);
        this.housingError = this.getLoadErrorMessage(err, 'logements');
        this.userHousings = [];
        this.isLoadingHousings = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadUserReservations(): void {
    this.isLoadingReservations = true;
    this.reservationError = '';

    this.resaService.getUserResa().subscribe({
      next: (data) => {
        console.log('PROFILE RESERVATION DATA:', data);
        const rawReservations = this.normalizeArray(data);
        this.userReservations = rawReservations.map((resa) => this.transformReservation(resa));
        this.enrichReservationHousingTitles();
        this.isLoadingReservations = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('PROFILE RESERVATION ERROR:', err);
        this.reservationError = this.getLoadErrorMessage(err, 'reservations');
        this.userReservations = [];
        this.isLoadingReservations = false;
        this.cdr.detectChanges();
      },
    });
  }

  private normalizeArray(data: any): any[] {
    if (Array.isArray(data)) {
      return data;
    }

    if (data && Array.isArray(data.data)) {
      return data.data;
    }

    if (data && Array.isArray(data.results)) {
      return data.results;
    }

    if (data && Array.isArray(data.items)) {
      return data.items;
    }

    if (data && typeof data === 'object' && this.looksLikeHousingOrReservation(data)) {
      return [data];
    }

    if (data && typeof data === 'object') {
      const numericKeys = Object.keys(data)
        .filter((key) => /^\d+$/.test(key))
        .sort((a, b) => Number(a) - Number(b));

      if (numericKeys.length > 0) {
        return numericKeys.map((key) => data[key]);
      }

      const firstArrayValue = Object.values(data).find((value) => Array.isArray(value));
      if (Array.isArray(firstArrayValue)) {
        return firstArrayValue;
      }

      const values = Object.values(data).filter((item) => item && typeof item === 'object');
      if (values.length > 0) {
        return values as any[];
      }
    }

    return [];
  }

  private looksLikeHousingOrReservation(value: any): boolean {
    if (!value || typeof value !== 'object') {
      return false;
    }

    return (
      value.id !== undefined &&
      (
        value.title !== undefined ||
        value.location !== undefined ||
        value.price_per_night !== undefined ||
        value.housing_id !== undefined ||
        value.start_date !== undefined ||
        value.check_in !== undefined
      )
    );
  }

  private getLoadErrorMessage(err: any, resource: 'logements' | 'reservations'): string {
    if (err?.status === 401) {
      return `Session expiree: impossible de charger vos ${resource}.`;
    }

    if (err?.status === 403) {
      return `Acces refuse: impossible de charger vos ${resource}.`;
    }

    return `Impossible de charger vos ${resource} pour le moment.`;
  }

  private transformReservation(resa: any): ReservationDisplay {
    const status = resa?.status || 'unknown';
    return {
      id: resa?.id || resa?.reservation_id || 0,
      title: resa?.housing_title || resa?.housing?.title || resa?.title || 'Logement sans titre',
      dateRange: this.formatDateRange(resa?.start_date, resa?.end_date),
      status: {
        value: status,
        label: this.statusLabels[status] || status,
      },
      notes: resa?.notes,
      housing_id: resa?.housing_id || resa?.housing?.id || undefined,
    };
  }

  private formatDateRange(startDate: string, endDate: string): string {
    if (!startDate && !endDate) {
      return 'Dates non disponibles';
    }

    const formatDate = (date: string) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    if (start && end) {
      return `${start} - ${end}`;
    }

    return start || end;
  }

  private enrichReservationHousingTitles(): void {
    const missingHousingIds = Array.from(
      new Set(
        this.userReservations
          .filter((reservation) => this.isMissingHousingTitle(reservation.title))
          .map((reservation) => Number(reservation.housing_id))
          .filter((housingId) => Number.isFinite(housingId) && housingId > 0),
      ),
    );

    if (missingHousingIds.length === 0) {
      return;
    }

    const requests = missingHousingIds.map((housingId) =>
      this.housingService.getById(housingId).pipe(
        map((payload) => ({ housingId, title: this.extractHousingTitle(payload) })),
        catchError(() => of({ housingId, title: '' })),
      ),
    );

    forkJoin(requests).subscribe((housingResults) => {
      const housingTitleMap = new Map<number, string>();
      housingResults.forEach((result) => {
        if (result.title) {
          housingTitleMap.set(result.housingId, result.title);
        }
      });

      this.userReservations = this.userReservations.map((reservation) => {
        const reservationHousingId = Number(reservation.housing_id);
        const resolvedTitle = housingTitleMap.get(reservationHousingId);

        if (!resolvedTitle || !this.isMissingHousingTitle(reservation.title)) {
          return reservation;
        }

        return {
          ...reservation,
          title: resolvedTitle,
        };
      });

      this.cdr.detectChanges();
    });
  }

  private isMissingHousingTitle(title: string | undefined): boolean {
    if (!title) {
      return true;
    }

    const normalizedTitle = title.trim().toLowerCase();
    return normalizedTitle.length === 0 || normalizedTitle === 'logement sans titre';
  }

  private extractHousingTitle(payload: any): string {
    const housing = this.unwrapObject(payload);
    const title = typeof housing?.title === 'string' ? housing.title.trim() : '';
    return title;
  }

  private unwrapObject(payload: any): any {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      return payload.data;
    }

    if (payload.result && typeof payload.result === 'object' && !Array.isArray(payload.result)) {
      return payload.result;
    }

    return payload;
  }

  getReservationTitle(resa: any): string {
    return (
      resa?.housing_title ||
      resa?.housing?.title ||
      resa?.title ||
      'Reservation'
    );
  }

  getReservationDates(resa: any): string {
    const start = resa?.start_date || resa?.check_in || resa?.startDate;
    const end = resa?.end_date || resa?.check_out || resa?.endDate;

    if (!start && !end) {
      return 'Dates non disponibles';
    }

    if (start && end) {
      return `${start} -> ${end}`;
    }

    return start || end;
  }

  trackById(index: number, item: any): number {
    return item?.id ?? index;
  }

  getHousingDetailQueryParams(housingId: number): { reservationId: number } | null {
    const relatedReservation = this.userReservations.find((resa) => {
      return Number(resa?.housing_id) === Number(housingId);
    });

    if (relatedReservation?.id) {
      return { reservationId: relatedReservation.id };
    }

    return null;
  }

  getHousingDetailsUrl(housingId: number): string {
    const query = this.getHousingDetailQueryParams(housingId);
    if (query?.reservationId) {
      return `/details/${housingId}?reservationId=${query.reservationId}`;
    }

    return `/details/${housingId}`;
  }
}
