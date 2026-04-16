import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { Housing, HousingSearchFilters } from '../core/models/housing.model';
import { ReservationRequest, ReservationStatus } from '../core/models/reservation.model';
import { HousingService } from '../core/services/housing.service';
import { ReservationService } from '../core/services/reservation.service';

@Component({
  selector: 'app-reservation-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation-page.component.html',
  styleUrls: ['./reservation-page.component.css'],
})
export class ReservationPageComponent implements OnInit {
  readonly statusOptions: ReservationStatus[] = [
    'pending',
    'under_review',
    'approved',
    'rejected',
    'cancelled',
  ];

  readonly searchForm = new FormGroup({
    location: new FormControl<string>('', { nonNullable: true }),
    propertyType: new FormControl<string>('', { nonNullable: true }),
    priceMax: new FormControl<number | null>(null),
    availableOnly: new FormControl<boolean>(true, { nonNullable: true }),
  });

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

  readonly myRequestsForm = new FormGroup({
    status: new FormControl<string>('pending', { nonNullable: true }),
  });

  housings: Housing[] = [];
  selectedHousing: Housing | null = null;
  myRequests: ReservationRequest[] = [];

  isLoadingHousings = false;
  isSubmittingReservation = false;
  isLoadingMyRequests = false;

  constructor(
    private readonly housingService: HousingService,
    private readonly reservationService: ReservationService,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadAllHousings();
    this.loadMyRequests();
  }

  loadAllHousings(): void {
    this.isLoadingHousings = true;

    this.housingService
      .getAllHousings()
      .pipe(finalize(() => (this.isLoadingHousings = false)))
      .subscribe({
        next: (housings) => {
          this.housings = housings;
        },
        error: () => {
          this.toastr.error('Impossible de charger les logements.');
        },
      });
  }

  searchHousings(): void {
    const filters: HousingSearchFilters = {
      location: this.searchForm.controls.location.value,
      property_type: this.searchForm.controls.propertyType.value,
      price_max: this.searchForm.controls.priceMax.value ?? undefined,
      available: this.searchForm.controls.availableOnly.value,
    };

    this.isLoadingHousings = true;

    this.housingService
      .searchHousings(filters)
      .pipe(finalize(() => (this.isLoadingHousings = false)))
      .subscribe({
        next: (housings) => {
          this.housings = housings;
        },
        error: () => {
          this.toastr.error('Echec de la recherche des logements.');
        },
      });
  }

  resetSearch(): void {
    this.searchForm.reset({
      location: '',
      propertyType: '',
      priceMax: null,
      availableOnly: true,
    });

    this.loadAllHousings();
  }

  chooseHousing(housing: Housing): void {
    this.selectedHousing = housing;
    this.reservationForm.controls.housingId.setValue(Number(housing.id));
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

    if (new Date(startDate) > new Date(endDate)) {
      this.toastr.error('La date de fin doit etre apres la date de debut.');
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
      .pipe(finalize(() => (this.isSubmittingReservation = false)))
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
          this.loadMyRequests();
        },
        error: () => {
          this.toastr.error('Impossible de creer la demande de reservation.');
        },
      });
  }

  loadMyRequests(): void {
    if (!sessionStorage.getItem('token')?.trim()) {
      this.myRequests = [];
      return;
    }

    this.isLoadingMyRequests = true;

    const status = this.myRequestsForm.controls.status.value.trim();

    this.reservationService
      .listMyReservationRequests({
        status: status || undefined,
      })
      .pipe(finalize(() => (this.isLoadingMyRequests = false)))
      .subscribe({
        next: (requests) => {
          this.myRequests = requests;
        },
        error: () => {
          this.toastr.error('Impossible de charger vos demandes de reservation.');
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
