import { EntityId } from './housing.model';

export type ReservationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | string;

export interface ReservationRequest {
  id: EntityId;
  tenant_id: number;
  housing_id: number;
  start_date: string;
  end_date: string;
  notes?: string;
  status: ReservationStatus;
  actor_id?: number;
  comment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateReservationRequestPayload {
  tenant_id: number;
  housing_id: number;
  start_date: string;
  end_date: string;
  notes?: string;
}

export interface ReservationQueryFilters {
  status?: string;
  tenant_id?: number;
}

export interface UpdateReservationStatusPayload {
  status: ReservationStatus;
  actor_id: number;
  comment?: string;
}
