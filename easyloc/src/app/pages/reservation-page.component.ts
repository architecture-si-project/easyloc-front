import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { Housing } from '../core/models/housing.model';
import { ReservationRequest, ReservationStatus } from '../core/models/reservation.model';
import { HousingService } from '../services/HousingService';
import { ResaService } from '../services/resaService';

@Component({
  selector: 'app-reservation-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reservation-page.component.html',
  styleUrls: ['./reservation-page.component.css'],
})
export class ReservationPageComponent implements OnInit {
  readonly todayDate = this.toInputDate(new Date());

  readonly reservationForm = new FormGroup({
    housingId: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    startDate: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    endDate: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    notes: new FormControl<string>('', { nonNullable: true }),
  });

  housings: Housing[] = [];
  selectedHousing: Housing | null = null;
  unavailablePeriods: ReservationRequest[] = [];

  isLoadingHousings = false;
  isSubmittingReservation = false;
  isLoadingAvailability = false;

  availabilityError = '';
  private pendingPreselectHousingId: number | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly housingService: HousingService,
    private readonly reservationService: ResaService,
    private readonly toastr: ToastrService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAllHousings();

    this.route.queryParamMap.subscribe((params) => {
      const housingIdParam = params.get('housingId');
      const housingId = housingIdParam ? Number(housingIdParam) : NaN;

      if (Number.isFinite(housingId) && housingId > 0) {
        this.preselectHousingById(housingId);
        return;
      }

      if (!this.selectedHousing) {
        this.selectFirstAvailableHousing();
      }
    });
  }

  get hasSelectedDateConflict(): boolean {
    const startDate = this.reservationForm.controls.startDate.value;
    const endDate = this.reservationForm.controls.endDate.value;

    if (!startDate || !endDate) {
      return false;
    }

    return this.hasDateConflict(startDate, endDate);
  }

  get canSubmitReservation(): boolean {
    return Boolean(
      this.selectedHousing?.available &&
        this.reservationForm.valid &&
        !this.hasSelectedDateConflict &&
        !this.isSubmittingReservation &&
        !this.isLoadingAvailability &&
        !this.availabilityError,
    );
  }

  loadAllHousings(): void {
    this.isLoadingHousings = true;

    this.housingService
      .getAll()
      .pipe(
        finalize(() => {
          this.isLoadingHousings = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (housings) => {
          this.housings = housings;

          if (this.pendingPreselectHousingId !== null) {
            const pendingId = this.pendingPreselectHousingId;
            this.pendingPreselectHousingId = null;
            this.preselectHousingById(pendingId);
            return;
          }

          if (!this.selectedHousing) {
            this.selectFirstAvailableHousing();
          }

          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Impossible de charger les logements.');
          this.cdr.detectChanges();
        },
      });
  }

  private selectFirstAvailableHousing(): void {
    const firstAvailableHousing = this.housings.find((housing) => housing.available);

    if (!firstAvailableHousing) {
      this.selectedHousing = null;
      this.reservationForm.controls.housingId.setValue(null);
      this.unavailablePeriods = [];
      return;
    }

    if (this.selectedHousing?.id === firstAvailableHousing.id) {
      return;
    }

    this.chooseHousing(firstAvailableHousing);
  }

  chooseHousing(housing: Housing): void {
    if (!housing.available) {
      this.toastr.warning('Ce logement est indisponible pour le moment.');
      this.cdr.detectChanges();
      return;
    }

    this.selectedHousing = housing;
    this.reservationForm.controls.housingId.setValue(Number(housing.id));
    this.loadAvailabilityForHousing(Number(housing.id));
    this.cdr.detectChanges();
  }

  private preselectHousingById(housingId: number): void {
    const alreadyLoaded = this.housings.find((housing) => Number(housing.id) === housingId);

    if (alreadyLoaded) {
      if (alreadyLoaded.available) {
        this.chooseHousing(alreadyLoaded);
      }
      return;
    }

    if (this.isLoadingHousings) {
      this.pendingPreselectHousingId = housingId;
      return;
    }

    this.housingService.getHousingById(housingId).subscribe({
      next: (housing) => {
        const exists = this.housings.some((item) => Number(item.id) === Number(housing.id));
        if (!exists) {
          this.housings = [housing, ...this.housings];
        }

        if (housing.available) {
          this.chooseHousing(housing);
          return;
        }

        this.toastr.info('Ce logement est actuellement indisponible.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.error('Impossible de charger le logement selectionne.');
        this.cdr.detectChanges();
      },
    });
  }

  private loadAvailabilityForHousing(housingId: number): void {
    this.isLoadingAvailability = true;
    this.availabilityError = '';
    this.unavailablePeriods = [];

    this.reservationService
      .listReservationRequests()
      .pipe(
        finalize(() => {
          this.isLoadingAvailability = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (requests) => {
          const normalized = this.normalizeRequests(requests);

          this.unavailablePeriods = normalized
            .filter((request) => Number(request.housing_id) === housingId)
            .filter((request) => this.isBlockingStatus(request.status))
            .filter((request) => Boolean(request.start_date) && Boolean(request.end_date))
            .sort(
              (a, b) =>
                new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
            );

          this.cdr.detectChanges();
        },
        error: () => {
          this.unavailablePeriods = [];
          this.availabilityError = 'Impossible de charger les periodes indisponibles.';
          this.cdr.detectChanges();
        },
      });
  }

  private normalizeRequests(data: unknown): ReservationRequest[] {
    if (Array.isArray(data)) {
      return data as ReservationRequest[];
    }

    if (data && typeof data === 'object') {
      const objectData = data as Record<string, unknown>;

      if (Array.isArray(objectData['data'])) {
        return objectData['data'] as ReservationRequest[];
      }

      if (Array.isArray(objectData['results'])) {
        return objectData['results'] as ReservationRequest[];
      }

      if (Array.isArray(objectData['items'])) {
        return objectData['items'] as ReservationRequest[];
      }
    }

    return [];
  }

  private isBlockingStatus(status: ReservationStatus | undefined): boolean {
    const normalized = String(status ?? '').toLowerCase();
    return normalized === 'approved' || normalized === 'under_review' || normalized === 'pending';
  }

  private hasDateConflict(startDate: string, endDate: string): boolean {
    const requestedStart = this.dateOnlyValue(startDate);
    const requestedEnd = this.dateOnlyValue(endDate);

    if (!requestedStart || !requestedEnd) {
      return false;
    }

    return this.unavailablePeriods.some((period) => {
      const periodStart = this.dateOnlyValue(period.start_date);
      const periodEnd = this.dateOnlyValue(period.end_date);

      if (!periodStart || !periodEnd) {
        return false;
      }

      return requestedStart <= periodEnd && requestedEnd >= periodStart;
    });
  }

  private dateOnlyValue(value: string): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return this.toInputDate(parsed);
  }

  private toInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDate(value: string): string {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString('fr-FR');
  }

  createReservationRequest(): void {
    if (!sessionStorage.getItem('token')?.trim()) {
      this.toastr.error('Connectez-vous pour creer une reservation.');
      return;
    }

    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    const startDate = this.reservationForm.controls.startDate.value;
    const endDate = this.reservationForm.controls.endDate.value;

    const selectedHousingId = this.selectedHousing?.id;
    if (!selectedHousingId) {
      this.toastr.error('Choisissez un logement depuis la liste du dashboard.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      this.toastr.error('La date de fin doit etre apres la date de debut.');
      return;
    }

    if (this.hasDateConflict(startDate, endDate)) {
      this.toastr.error('Ce logement est deja reserve sur cette periode.');
      return;
    }

    const housingId = this.reservationForm.controls.housingId.value;

    if (housingId === null) {
      this.toastr.error('Selectionnez un logement.');
      return;
    }

    this.isSubmittingReservation = true;

    this.reservationService
      .createReservationRequest({
        housing_id: housingId,
        start_date: startDate,
        end_date: endDate,
        notes: this.reservationForm.controls.notes.value.trim() || undefined,
      })
      .pipe(
        finalize(() => {
          this.isSubmittingReservation = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (reservation) => {
          const reservationId = reservation.reservation_id ?? reservation.id;
          const successMessage = reservationId
            ? `Demande envoyee (ID: ${reservationId}).`
            : 'Demande de reservation envoyee.';

          this.toastr.success(successMessage);
          this.reservationForm.patchValue({
            startDate: '',
            endDate: '',
            notes: '',
          });
          this.loadAvailabilityForHousing(Number(housingId));
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Impossible de creer la demande de reservation.');
          this.cdr.detectChanges();
        },
      });
  }

  trackRequestId(index: number, request: ReservationRequest): string | number {
    return request.reservation_id ?? request.id ?? `request-${index}-${request.housing_id}-${request.start_date}`;
  }

  displayRequestId(request: ReservationRequest): string | number {
    return request.reservation_id ?? request.id ?? '-';
  }

  statusClass(status: string): string {
    if (status === 'approved') {
      return 'status-approved';
    }

    if (status === 'rejected' || status === 'cancelled') {
      return 'status-rejected';
    }

    if (status === 'under_review') {
      return 'status-review';
    }

    return 'status-pending';
  }
}
