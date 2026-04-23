import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HousingService } from '../services/HousingService';
import { ResaService } from '../services/resaService';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-detaile-component',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './detaile-component.html',
  styleUrl: './detaile-component.css',
})
export class DetaileComponent implements OnInit {
  housing: any = null;
  editableHousing: any = null;
  reservations: any[] = [];

  isLoadingHousing = true;
  isLoadingReservations = false;
  updatingReservationId: number | null = null;
  tenantLabels: Record<number, string> = {};

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
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDetails();
  }

  private loadDetails(): void {
    const housingId = Number(this.route.snapshot.paramMap.get('housingId'));

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

    this.isLoadingReservations = true;
    this.reservationError = '';

    this.resaService.listReservationRequests({ housing_id: housingId }).subscribe({
      next: (data) => {
        console.log('DETAIL RESERVATIONS DATA:', data);
        const allReservations = this.normalizeArray(data);
        this.reservations = allReservations.filter((reservation) => {
          const reservationHousingId = Number(
            reservation?.housing_id ?? reservation?.housing?.id ?? reservation?.housing?.housing_id,
          );
          return Number.isFinite(reservationHousingId) && reservationHousingId === housingId;
        });
        this.loadTenantLabels();
        this.isLoadingReservations = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('DETAIL RESERVATIONS ERROR:', err);
        this.reservationError = this.getLoadErrorMessage(err, 'reservations');
        this.reservations = [];
        this.isLoadingReservations = false;
        this.cdr.detectChanges();
      },
    });
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

  private normalizeArray(data: any): any[] {
    if (Array.isArray(data)) {
      return data;
    }

    if (!data || typeof data !== 'object') {
      return [];
    }

    if (Array.isArray(data.data)) {
      return data.data;
    }

    if (Array.isArray(data.results)) {
      return data.results;
    }

    if (Array.isArray(data.items)) {
      return data.items;
    }

    return [];
  }

  private getLoadErrorMessage(err: any, resource: 'logement' | 'reservation' | 'reservations'): string {
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

  getReservationDateRange(reservation: any): string {
    const start = reservation?.start_date || reservation?.check_in || reservation?.startDate;
    const end = reservation?.end_date || reservation?.check_out || reservation?.endDate;

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

  getReservationId(reservation: any): number | null {
    const id = Number(reservation?.id ?? reservation?.reservation_id);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  getTenantLabel(reservation: any): string {
    const tenantId = Number(reservation?.tenant_id);
    if (!Number.isFinite(tenantId) || tenantId <= 0) {
      return 'Locataire inconnu';
    }

    return this.tenantLabels[tenantId] || `Locataire #${tenantId}`;
  }

  canDecideReservation(reservation: any): boolean {
    const status = String(reservation?.status || '').toLowerCase();
    return status === 'pending' || status === 'under_review';
  }

  updateReservationDecision(reservation: any, status: 'approved' | 'rejected'): void {
    const reservationId = this.getReservationId(reservation);
    if (!reservationId) {
      this.reservationError = 'Reservation invalide.';
      this.cdr.detectChanges();
      return;
    }

    const actorId = Number(this.housing?.owner_id);
    if (!Number.isFinite(actorId) || actorId <= 0) {
      this.reservationError = 'Impossible de determiner le proprietaire pour valider/refuser.';
      this.cdr.detectChanges();
      return;
    }

    this.updatingReservationId = reservationId;
    this.reservationError = '';

    this.resaService.updateReservationStatus(reservationId, { status, actor_id: actorId }).subscribe({
      next: (updatedReservation) => {
        const updatedId = this.getReservationId(updatedReservation);
        this.reservations = this.reservations.map((item) => {
          const itemId = this.getReservationId(item);
          if (itemId !== reservationId) {
            return item;
          }

          if (updatedId) {
            return { ...item, ...updatedReservation };
          }

          return { ...item, status };
        });

        this.updatingReservationId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.updatingReservationId = null;
        this.reservationError = this.getStatusUpdateErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
  }

  private getStatusUpdateErrorMessage(err: any): string {
    if (err?.status === 400) {
      return 'Statut invalide. Seuls approved et rejected sont autorises.';
    }

    if (err?.status === 404) {
      return 'Demande de reservation introuvable.';
    }

    if (err?.status === 409) {
      return 'Transition de statut invalide pour cette demande.';
    }

    return 'Impossible de mettre a jour le statut de la reservation.';
  }

  private loadTenantLabels(): void {
    const tenantIds = Array.from(
      new Set(
        this.reservations
          .map((reservation) => Number(reservation?.tenant_id))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );

    if (tenantIds.length === 0) {
      return;
    }

    const requests = tenantIds.map((tenantId) =>
      this.userService.getUserById(tenantId).pipe(catchError(() => of({ id: tenantId }))),
    );

    forkJoin(requests).subscribe((users) => {
      users.forEach((user) => {
        const userId = Number(user?.id);
        if (!Number.isFinite(userId) || userId <= 0) {
          return;
        }

        const userWithOptionalEmail = user as { id: number; email?: string };
        const email = typeof userWithOptionalEmail.email === 'string' ? userWithOptionalEmail.email.trim() : '';
        this.tenantLabels[userId] = email || `Locataire #${userId}`;
      });

      this.cdr.detectChanges();
    });
  }
}
