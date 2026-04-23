import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

import { ReservationRequest, ReservationStatus } from '../core/models/reservation.model';
import { ResaService } from '../services/resaService';

@Component({
  selector: 'app-tracking-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tracking-page.component.html',
  styleUrls: ['./tracking-page.component.css'],
})
export class TrackingPageComponent implements OnInit {
  readonly statusOptions: ReservationStatus[] = [
    'pending',
    'under_review',
    'approved',
    'rejected',
    'contract_signed',
    'active',
    'closed',
  ];

  readonly updateForm = new FormGroup({
    reservationId: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    status: new FormControl<ReservationStatus>('under_review', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    actorId: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    comment: new FormControl<string>('', { nonNullable: true }),
  });

  requests: ReservationRequest[] = [];
  isLoadingRequests = false;
  isUpdatingStatus = false;

  constructor(
    private readonly reservationService: ResaService,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoadingRequests = true;

    this.reservationService
      .listReservationRequests()
      .pipe(finalize(() => (this.isLoadingRequests = false)))
      .subscribe({
        next: (requests) => {
          this.requests = requests;
        },
        error: () => {
          this.toastr.error('Impossible de charger les demandes.');
        },
      });
  }

  prepareUpdate(request: ReservationRequest): void {
    this.updateForm.patchValue({
      reservationId: Number(request.id),
      status: request.status,
      comment: request.comment ?? '',
    });
  }

  updateReservationStatus(): void {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }

    const reservationId = this.updateForm.controls.reservationId.value;

    if (reservationId === null) {
      this.toastr.error('Selectionnez une demande a mettre a jour.');
      return;
    }

    this.isUpdatingStatus = true;

    this.reservationService
      .updateReservationStatus(reservationId, {
        status: this.updateForm.controls.status.value,
        actor_id: this.updateForm.controls.actorId.value,
        comment: this.updateForm.controls.comment.value.trim() || undefined,
      })
      .pipe(finalize(() => (this.isUpdatingStatus = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Statut mis a jour avec succes.');
          this.loadRequests();
        },
        error: () => {
          this.toastr.error('Echec de la mise a jour du statut.');
        },
      });
  }

  statusClass(status: string): string {
    if (status === 'approved') {
      return 'status-approved';
    }

    if (status === 'rejected' || status === 'closed') {
      return 'status-rejected';
    }

    if (status === 'contract_signed' || status === 'active') {
      return 'status-approved';
    }

    if (status === 'under_review') {
      return 'status-review';
    }

    return 'status-pending';
  }
}
