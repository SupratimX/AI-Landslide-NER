"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Zone } from "@/types";
import { scoreColor, scoreLevelText } from "@/lib/api";

interface Props {
  zones: Zone[];
  selected: Zone | null;
  onSelect: (z: Zone) => void;
}

export default function MapView({ zones, selected, onSelect }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      center: [25.5, 92.5],  //center of NER
      zoom: 6,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when zones change
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;
    markersRef.current.clearLayers();

    zones.forEach((z) => {
      const col = scoreColor(z.score);
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:${col};border:2px solid rgba(255,255,255,0.4);
          display:flex;align-items:center;justify-content:center;
          font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;
          color:${z.score >= 50 && z.score < 70 ? "#111" : "#fff"};
          box-shadow:0 0 14px ${col}88;
        ">${Math.round(z.score)}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([z.lat, z.lon], { icon })
        .bindPopup(
          `
          <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#e8f4ff">${z.name}</div>
          <div style="font-size:22px;font-weight:700;font-family:'IBM Plex Mono',monospace;text-align:center;color:${col}">${z.score}%</div>
          <div style="text-align:center;font-size:12px;color:${col};margin-bottom:8px">${scoreLevelText(z.score)}</div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0">
            <span style="color:#5a7a9a">District</span>
            <span style="font-family:monospace;font-weight:600">${z.district}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0">
            <span style="color:#5a7a9a">Rainfall</span>
            <span style="font-family:monospace;font-weight:600;color:#3b9ddd">${z.rainfall} mm</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0">
            <span style="color:#5a7a9a">Soil moisture</span>
            <span style="font-family:monospace;font-weight:600;color:#3b9ddd">${z.moisture}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0">
            <span style="color:#5a7a9a">Slope</span>
            <span style="font-family:monospace;font-weight:600">${z.slope}°</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin:4px 0">
            <span style="color:#5a7a9a">Elevation</span>
            <span style="font-family:monospace;font-weight:600">${z.elevation} m</span>
          </div>
        `
        )
        .on("click", () => onSelect(z));

      markersRef.current!.addLayer(marker);

      // Risk circle
      const circle = L.circle([z.lat, z.lon], {
        radius: 8000,
        color: col,
        fillColor: col,
        fillOpacity: 0.08,
        weight: 1,
      });
      markersRef.current!.addLayer(circle);
    });
  }, [zones, onSelect]);

  // Fly to selected zone
  useEffect(() => {
    if (selected && mapRef.current) {
      mapRef.current.setView([selected.lat, selected.lon], 10, {
        animate: true,
      });
    }
  }, [selected]);

  return <div ref={containerRef} className="flex-1 w-full h-full min-h-0" />;
}
