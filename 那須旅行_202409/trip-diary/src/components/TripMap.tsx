import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { type LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { TripEvent } from "../types/trip";
import { formatDayHeading, formatTime } from "../utils/date";

// バンドラー環境ではLeafletの既定マーカー画像パスが解決できないため明示的に設定する
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface TripMapProps {
  events: TripEvent[];
}

interface PinnedEvent extends TripEvent {
  coords: NonNullable<TripEvent["coords"]>;
}

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  return null;
}

export default function TripMap({ events }: TripMapProps) {
  const pinned = events.filter((event): event is PinnedEvent => event.coords !== null);

  if (pinned.length === 0) {
    return null;
  }

  const bounds: LatLngBoundsExpression = pinned.map((event) => [event.coords.lat, event.coords.lng]);
  const center: [number, number] = [pinned[0].coords.lat, pinned[0].coords.lng];

  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">地図</h2>
      <div className="h-96 overflow-hidden rounded-lg">
        <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds bounds={bounds} />
          {pinned.map((event) => (
            <Marker key={event.id} position={[event.coords.lat, event.coords.lng]}>
              <Popup>
                <p className="font-semibold text-ink">{event.title}</p>
                <p className="text-xs text-ink/60">
                  {formatDayHeading(event.dateISO)}
                  {event.hasTime ? ` ${formatTime(event.dateISO)}` : ""}
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-accent underline underline-offset-2"
                >
                  Googleマップで開く
                </a>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}
