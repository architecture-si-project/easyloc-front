import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { Housing, HousingSearchFilters } from '../core/models/housing.model';
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
  readonly searchForm = new FormGroup({
    location: new FormControl<string>('', { nonNullable: true }),
    propertyType: new FormControl<string>('', { nonNullable: true }),
    priceMax: new FormControl<number | null>(null),
    availableOnly: new FormControl<boolean>(true, { nonNullable: true }),
  });

  readonly reservationForm = new FormGroup({
    tenantId: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
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

  isLoadingHousings = false;
  isSubmittingReservation = false;

  constructor(
    private readonly housingService: HousingService,
    private readonly reservationService: ReservationService,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadAllHousings();
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

    const tenantId = this.reservationForm.controls.tenantId.value;
    const housingId = this.reservationForm.controls.housingId.value;

    if (housingId === null) {
      this.toastr.error('Selectionnez un logement.');
      return;
    }

    this.isSubmittingReservation = true;

    this.reservationService
      .createReservationRequest({
        tenant_id: tenantId,
        housing_id: housingId,
        start_date: startDate,
        end_date: endDate,
        notes: this.reservationForm.controls.notes.value.trim() || undefined,
      })
      .pipe(finalize(() => (this.isSubmittingReservation = false)))
      .subscribe({
        next: (reservation) => {
          this.toastr.success(`Demande envoyee (ID: ${reservation.id}).`);
          this.reservationForm.patchValue({
            startDate: '',
            endDate: '',
            notes: '',
          });
        },
        error: () => {
          this.toastr.error('Impossible de creer la demande de reservation.');
        },
      });
  }
}
