export interface TripEvent {
  id: string;
  title: string;
  dateISO: string;
  hasTime: boolean;
  memo: string;
  mapUrl?: string;
  mapEmbedUrl: string | null;
  photos: string[];
  videoUrl?: string;
  videoEmbedUrl: string | null;
  videoEmbedType: "youtube" | "drive" | "unknown";
}

export interface TripData {
  tripTitle: string;
  heroImage: string | null;
  generatedAt: string;
  events: TripEvent[];
}
