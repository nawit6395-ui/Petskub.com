import L, { type LeafletEvent, type Marker as LeafletMarker } from "leaflet";

const iconRetinaUrl = new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString();
const iconUrl = new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString();
const shadowUrl = new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString();
const customMarkerUrl = "https://img2.pic.in.th/pic/Petskub-2.png";

export const defaultMarkerIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [21, 34],
  iconAnchor: [10, 34],
  popupAnchor: [1, -28],
  shadowSize: [34, 34],
});

export const locationMarkerIcon = L.icon({
  iconUrl: customMarkerUrl,
  iconSize: [34, 34],
  iconAnchor: [17, 32],
  popupAnchor: [0, -28],
});

export const defaultMapCenter: L.LatLngLiteral = {
  lat: 13.736717,
  lng: 100.523186,
};

export type Coordinates = L.LatLngLiteral;

const mapTilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;
const hasMapTilerKey = Boolean(mapTilerApiKey);

if (import.meta.env.DEV && !hasMapTilerKey) {
  console.warn("VITE_MAPTILER_API_KEY is missing. Falling back to OpenStreetMap tiles.");
}

const mapTilerAttribution =
  '© <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">MapTiler</a> ' +
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>';

const openStreetMapAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const tileLayerUrl = hasMapTilerKey
  ? `https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=${mapTilerApiKey}`
  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const tileLayerAttribution = hasMapTilerKey ? mapTilerAttribution : openStreetMapAttribution;

export const tileLayerOptions: L.TileLayerOptions = hasMapTilerKey
  ? {
      attribution: tileLayerAttribution,
      tileSize: 512,
      zoomOffset: -1,
      minZoom: 2,
      maxZoom: 19,
      detectRetina: true,
    }
  : {
      attribution: tileLayerAttribution,
    };

type MarkerWithPopupState = LeafletMarker & { _popupPinned?: boolean };

const getMarkerFromEvent = (event: LeafletEvent): MarkerWithPopupState | null => {
  const marker = event.target as MarkerWithPopupState | undefined;
  return marker ?? null;
};

export const openMarkerPopup = (event: LeafletEvent) => {
  getMarkerFromEvent(event)?.openPopup();
};

export const closeMarkerPopup = (event: LeafletEvent) => {
  const marker = getMarkerFromEvent(event);
  if (!marker || marker._popupPinned) return;
  marker.closePopup();
};

export const pinMarkerPopup = (event: LeafletEvent) => {
  const marker = getMarkerFromEvent(event);
  if (!marker) return;
  marker._popupPinned = true;
  marker.openPopup();
};

export const releaseMarkerPopup = (event: LeafletEvent) => {
  const marker = getMarkerFromEvent(event);
  if (!marker) return;
  marker._popupPinned = false;
};
