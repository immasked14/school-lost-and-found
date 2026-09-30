export type LostItem = {
  id: string;
  item_name?: string;
  item_type?: string;
  color?: string;
  location?: string;
  date_lost?: string;
  status?: string;
};

export type FoundItem = {
  id: string;
  item_name?: string;
  item_type?: string;
  color?: string;
  location?: string;
  date_found?: string;
  status?: string;
};

export type Claim = {
  id: string;
  found_item_id?: string;
  student_name?: string;
  item_description?: string;
  identifying_details?: string;
  additional_proof?: string;
  photo_url?: string;
  status?: string;
  created_at?: string;
};
