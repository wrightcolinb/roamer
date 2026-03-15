export type Destination = {
  id: string;
  name: string;
  place_id?: string;
  lat: number;
  lng: number;
  status: "been" | "planning" | "dreaming";
  notes: string;
  created_at: string;
};
