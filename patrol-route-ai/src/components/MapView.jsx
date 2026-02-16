import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import zones from "../data/riskZones.json";

// Tactical Pulse Marker
const tacticalIcon = (risk) => new L.divIcon({
  className: "custom-tactical-icon",
  html: `
    <div class="relative flex items-center justify-center">
      <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full ${risk >= 8 ? 'bg-red-400' : 'bg-blue-400'} opacity-20"></span>
      <div class="relative h-3 w-3 rounded-full border-2 border-white shadow-lg ${risk >= 8 ? 'bg-red-500' : 'bg-blue-500'}"></div>
    </div>`,
  iconSize: [32, 32],
});

export default function MapView() {
  return (
    <MapContainer
      center={[13.0827, 80.2707]}
      zoom={13}
      zoomControl={false} // We move this for a cleaner UI
      style={{ height: "100%", width: "100%", background: "#020617" }}
    >
      <ZoomControl position="bottomright" />
      
      {/* Dark Tactical Map Tiles */}
      <TileLayer
        attribution='&copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {zones.map((zone) => (
        <Marker 
          key={zone.id} 
          position={[zone.lat, zone.lng]} 
          icon={tacticalIcon(zone.risk)}
        >
          <Popup className="tactical-popup">
            <div className="p-1">
              <h3 className="text-sm font-bold m-0">{zone.name}</h3>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Risk Index</span>
                <span className={`text-xs font-black ${zone.risk >= 8 ? 'text-red-500' : 'text-blue-500'}`}>
                  {zone.risk}/10
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                <div 
                   className={`h-full ${zone.risk >= 8 ? 'bg-red-500' : 'bg-blue-500'}`} 
                   style={{ width: `${zone.risk * 10}%` }}
                />
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}