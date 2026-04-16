import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HousingService } from '../services/HousingService';
import { ResaService } from '../services/resaService';

@Component({
  selector: 'app-profile-component',
  imports: [CommonModule],
  templateUrl: './profile-component.html',
  styleUrl: './profile-component.css',
})
export class ProfileComponent implements OnInit {
  userHousings: any[] = [];
  userReservations: any[] = [];

  isLoadingHousings = true;
  isLoadingReservations = true;

  housingError = '';
  reservationError = '';

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
        this.userReservations = this.normalizeArray(data);
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
      const resaHousingId = resa?.housing_id || resa?.housing?.id || resa?.housing?.housing_id;
      return Number(resaHousingId) === Number(housingId);
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
