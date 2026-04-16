import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HousingService } from '../services/HousingService';
import { ResaService } from '../services/resaService';

@Component({
  selector: 'app-detaile-component',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './detaile-component.html',
  styleUrl: './detaile-component.css',
})
export class DetaileComponent implements OnInit {
  housing: any = null;
  editableHousing: any = null;
  reservation: any = null;

  isLoadingHousing = true;
  isLoadingReservation = false;

  housingError = '';
  reservationError = '';
  saveError = '';
  saveSuccess = '';
  isEditingHousing = false;
  isSavingHousing = false;

  constructor(
    private route: ActivatedRoute,
    private housingService: HousingService,
    private resaService: ResaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDetails();
  }

  private loadDetails(): void {
    const housingId = Number(this.route.snapshot.paramMap.get('housingId'));
    const reservationIdParam = this.route.snapshot.queryParamMap.get('reservationId');
    const reservationId = reservationIdParam ? Number(reservationIdParam) : NaN;

    if (!Number.isFinite(housingId) || housingId <= 0) {
      this.housingError = 'Identifiant du logement invalide.';
      this.isLoadingHousing = false;
      return;
    }

    this.housingService.getById(housingId).subscribe({
      next: (data) => {
        console.log('DETAIL HOUSING DATA:', data);
        this.housing = this.unwrapSingleObject(data);
        this.editableHousing = {
          title: this.housing?.title || '',
          description: this.housing?.description || '',
          location: this.housing?.location || '',
          property_type: this.housing?.property_type || '',
          price_per_night: Number(this.housing?.price_per_night ?? 0),
          available: Boolean(this.housing?.available),
        };
        this.isLoadingHousing = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('DETAIL HOUSING ERROR:', err);
        this.housingError = this.getLoadErrorMessage(err, 'logement');
        this.housing = null;
        this.isLoadingHousing = false;
        this.cdr.detectChanges();
      },
    });

    if (Number.isFinite(reservationId) && reservationId > 0) {
      this.isLoadingReservation = true;
      this.reservationError = '';

      this.resaService.getRequestById(reservationId).subscribe({
        next: (data) => {
          console.log('DETAIL RESERVATION DATA:', data);
          this.reservation = this.unwrapSingleObject(data);
          this.isLoadingReservation = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('DETAIL RESERVATION ERROR:', err);
          this.reservationError = this.getLoadErrorMessage(err, 'reservation');
          this.reservation = null;
          this.isLoadingReservation = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      this.reservation = null;
      this.reservationError = 'Aucune reservation liee a afficher.';
      this.isLoadingReservation = false;
      this.cdr.detectChanges();
    }
  }

  private unwrapSingleObject(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      return data.data;
    }

    if (data.result && typeof data.result === 'object' && !Array.isArray(data.result)) {
      return data.result;
    }

    return data;
  }

  private getLoadErrorMessage(err: any, resource: 'logement' | 'reservation'): string {
    if (err?.status === 401) {
      return `Session expiree: impossible de charger le ${resource}.`;
    }

    if (err?.status === 403) {
      return `Acces refuse: impossible de charger le ${resource}.`;
    }

    if (err?.status === 404) {
      return `${resource === 'logement' ? 'Logement' : 'Reservation'} introuvable.`;
    }

    return `Impossible de charger le detail du ${resource}.`;
  }

  getReservationDateRange(): string {
    const start = this.reservation?.start_date || this.reservation?.check_in || this.reservation?.startDate;
    const end = this.reservation?.end_date || this.reservation?.check_out || this.reservation?.endDate;

    if (!start && !end) {
      return 'Dates non disponibles';
    }

    return start && end ? `${start} -> ${end}` : start || end;
  }

  formatDate(value: any): string {
    if (!value) {
      return 'N/A';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString('fr-FR');
  }

  formatPrice(value: any): string {
    const price = Number(value);
    if (!Number.isFinite(price)) {
      return '0.00';
    }

    return price.toFixed(2);
  }

  startEditingHousing(): void {
    if (!this.housing) {
      return;
    }

    this.saveError = '';
    this.saveSuccess = '';
    this.isEditingHousing = true;
    this.editableHousing = {
      title: this.housing?.title || '',
      description: this.housing?.description || '',
      location: this.housing?.location || '',
      property_type: this.housing?.property_type || '',
      price_per_night: Number(this.housing?.price_per_night ?? 0),
      available: Boolean(this.housing?.available),
    };
  }

  cancelEditingHousing(): void {
    this.isEditingHousing = false;
    this.saveError = '';
  }

  saveHousing(): void {
    if (!this.housing?.id) {
      this.saveError = 'ID logement invalide.';
      return;
    }

    this.isSavingHousing = true;
    this.saveError = '';
    this.saveSuccess = '';

    const payload = {
      title: (this.editableHousing?.title || '').trim(),
      description: this.editableHousing?.description || '',
      location: (this.editableHousing?.location || '').trim(),
      property_type: (this.editableHousing?.property_type || '').trim(),
      price_per_night: Number(this.editableHousing?.price_per_night ?? 0),
      available: Boolean(this.editableHousing?.available),
    };

    this.housingService.updateHousing(this.housing.id, payload).subscribe({
      next: (updated) => {
        console.log('DETAIL HOUSING UPDATED:', updated);
        this.housing = this.unwrapSingleObject(updated);
        this.editableHousing = {
          title: this.housing?.title || '',
          description: this.housing?.description || '',
          location: this.housing?.location || '',
          property_type: this.housing?.property_type || '',
          price_per_night: Number(this.housing?.price_per_night ?? 0),
          available: Boolean(this.housing?.available),
        };
        this.isEditingHousing = false;
        this.isSavingHousing = false;
        this.saveSuccess = 'Logement mis a jour avec succes.';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('DETAIL HOUSING UPDATE ERROR:', err);
        this.isSavingHousing = false;
        this.saveError = this.getLoadErrorMessage(err, 'logement');
        this.cdr.detectChanges();
      },
    });
  }
}
