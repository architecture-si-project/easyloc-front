import { EntityId } from './housing.model';

export type ReservationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'contract_signed'
  | 'active'
  | 'closed'
  | string;

export interface ReservationRequest {
  id?: EntityId;
  reservation_id?: EntityId;
  tenant_id?: number;
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
  housing_id: number;
  start_date: string;
  end_date: string;
  notes?: string;
}

export interface CreateReservationRequestResponse {
  reservation_id?: EntityId;
  id?: EntityId;
  message?: string;
  status?: ReservationStatus;
}

export interface ReservationQueryFilters {
  status?: string;
  tenant_id?: number;
  housing_id?: number;
}

export interface UpdateReservationStatusPayload {
  status: ReservationStatus;
  actor_id: number;
  comment?: string;
}
