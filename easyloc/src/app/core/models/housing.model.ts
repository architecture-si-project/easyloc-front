export type EntityId = string | number;

export interface Housing {
  id: EntityId;
  title: string;
  description?: string;
  property_type: string;
  location: string;
  price_per_night: number;
  available: boolean;
  owner_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface HousingSearchFilters {
  location?: string;
  property_type?: string;
  price_max?: number;
  available?: boolean;
}
