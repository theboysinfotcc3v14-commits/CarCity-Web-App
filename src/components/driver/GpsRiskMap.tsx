import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Car,
  X,
  Navigation,
  Crosshair,
  Search,
  CheckCircle2,
  Route as RouteIcon,
  ShieldAlert,
  Phone,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  MapPin,
  Check,
  ExternalLink,
  Loader2,
  Lock,
  Shield,
  Sliders,
  BellRing,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { RiskReport, Workshop, RiskType } from '../../types/index.ts';
import { DEFAULT_VEHICLES } from '../../lib/telemetry.ts';

// [BLOCO 1] Localização Padrão: CEEP Newton Sucupira — Setor F de Mussurunga, Salvador - BA
export const CEEP_NEWTON_SUCUPIRA_LOCATION: [number, number] = [-12.9135, -38.3892];
const SALVADOR_CENTER: [number, number] = CEEP_NEWTON_SUCUPIRA_LOCATION;

// [BLOCO 2] Áreas de Risco Crítico e Atenção Mapeadas em Salvador (BA)
export interface RiskZone {
  id: string;
  name: string;
  level: 'CRITICAL' | 'WARNING';
  color: string;
  borderColor: string;
  badge: string;
  description: string;
  polygon: [number, number][];
  center: [number, number];
}

export const SALVADOR_RISK_ZONES: RiskZone[] = [
  {
    id: 'zone-1-paralela',
    name: 'Zona 1 (Crítica) — Av. Luís Viana Filho (Paralela) & Narandiba / Imbuí',
    level: 'CRITICAL',
    color: '#E5484D',
    borderColor: '#E5484D',
    badge: 'Zona Crítica: Paralela / Narandiba',
    description:
      'Alto índice histórico de abordagens noturnas e roubos de veículos em retornos e acessos a Narandiba e Imbuí.',
    polygon: [
      [-12.9560, -38.4480],
      [-12.9640, -38.4410],
      [-12.9730, -38.4490],
      [-12.9690, -38.4600],
      [-12.9580, -38.4560],
    ],
    center: [-12.9640, -38.4490],
  },
  {
    id: 'zone-2-bonoco',
    name: 'Zona 2 (Crítica) — Av. Mario Leal Ferreira (Bonocô) & BR-324 / Largo do Tanque',
    level: 'CRITICAL',
    color: '#E5484D',
    borderColor: '#E5484D',
    badge: 'Zona Crítica: Bonocô / BR-324',
    description:
      'Corredor de alta velocidade com pontos cegos e histórico de aproximação armada em semáforos e acessos rodoviários.',
    polygon: [
      [-12.9650, -38.4980],
      [-12.9680, -38.4850],
      [-12.9780, -38.4880],
      [-12.9800, -38.4970],
      [-12.9730, -38.5020],
    ],
    center: [-12.9730, -38.4940],
  },
  {
    id: 'zone-3-retiro',
    name: 'Zona 3 (Atenção) — Largo do Retiro & Pirajá',
    level: 'WARNING',
    color: '#E09F3E',
    borderColor: '#E09F3E',
    badge: 'Zona de Atenção: Largo do Retiro / Pirajá',
    description:
      'Furtos frequentes de módulos e estepe em veículos estacionados em vias públicas secundárias.',
    polygon: [
      [-12.9350, -38.4750],
      [-12.9380, -38.4610],
      [-12.9490, -38.4670],
      [-12.9460, -38.4790],
    ],
    center: [-12.9420, -38.4710],
  },
  {
    id: 'zone-4-garibaldi',
    name: 'Zona 4 (Atenção) — Vasco da Gama / Garibaldi (Período Noturno)',
    level: 'WARNING',
    color: '#E09F3E',
    borderColor: '#E09F3E',
    badge: 'Zona de Atenção: Vasco da Gama / Garibaldi',
    description:
      'Tráfego reduzido e iluminação irregular após 21h; manobras de bloqueio simulado registradas por usuários.',
    polygon: [
      [-12.9820, -38.5080],
      [-12.9860, -38.4940],
      [-12.9970, -38.4980],
      [-12.9930, -38.5120],
    ],
    center: [-12.9890, -38.5030],
  },
];

// [BLOCO 4] Oficinas Homologadas com Selo Anti-Fraude em Salvador
export const SALVADOR_WORKSHOPS: Workshop[] = [
  {
    id: 'ws-autotech-001',
    owner_user_id: 'usr-workshop-001',
    razao_social: 'AutoTech Centro Automotivo Especializado LTDA',
    nome_fantasia: 'AutoTech Premium - Unidade Pituba',
    cnpj: '12.345.678/0001-90',
    address: 'Av. Manoel Dias da Silva, 1850 - Pituba, Salvador - BA',
    latitude: -12.9900,
    longitude: -38.4600,
    rating: 4.9,
    reviews_count: 142,
    phone: '(71) 3345-6789',
    email: 'pituba@autotechpremium.com.br',
    specialties: [
      'Mecânica Geral & Injeção Eletrônica',
      'Elétrica, Telemetria & Sensores IoT',
      'Híbridos & Veículos Elétricos (EV)',
      'Alinhamento 3D & Freios Preditivos',
    ],
    status: 'VERIFIED',
    review_feedback: 'Homologada pelo Conselho Técnico CarCity com Selo Anti-Fraude emitido.',
    drivers_served_count: 142,
    benefits_revenue: 88400,
  },
  {
    id: 'ws-eletrocar-002',
    owner_user_id: 'usr-workshop-002',
    razao_social: 'EletroCar Soluções em Mobilidade Sustentável',
    nome_fantasia: 'EletroCar Híbridos & EV - Unidade Comércio',
    cnpj: '34.567.890/0001-12',
    address: 'Av. da França, 400 - Comércio, Salvador - BA',
    latitude: -12.9680,
    longitude: -38.5120,
    rating: 4.8,
    reviews_count: 98,
    phone: '(71) 3241-9900',
    email: 'comercio@eletrocar.com.br',
    specialties: ['Baterias Alta Voltagem EV', 'Diagnóstico OBD-II', 'Inversores & Regeneração'],
    status: 'VERIFIED',
    review_feedback: 'Oficina especializada em alta voltagem e telemetria preditiva.',
    drivers_served_count: 89,
    benefits_revenue: 24300,
  },
  {
    id: 'ws-salvador-004',
    owner_user_id: 'usr-workshop-003',
    razao_social: 'Salvador Centro Automotivo Preditivo LTDA',
    nome_fantasia: 'Salvador Oficina Preditiva - Unidade Stiep / Caminho das Árvores',
    cnpj: '45.890.123/0001-44',
    address: 'Alameda Salvador, 1057 - Caminho das Árvores, Salvador - BA',
    latitude: -12.9810,
    longitude: -38.4520,
    rating: 4.9,
    reviews_count: 115,
    phone: '(71) 3450-8080',
    email: 'stiep@salvadorpreditiva.com.br',
    specialties: ['Diagnóstico Preditivo CAN', 'Freios ABS & Cerâmica', 'Telemetria & Corte IoT'],
    status: 'VERIFIED',
    review_feedback: 'Certificação CFT/CREA regular e scanners oficiais homologados.',
    drivers_served_count: 120,
    benefits_revenue: 62000,
  },
];

// Destinos Populares em Salvador para Rotas Rápidas
const POPULAR_DESTINATIONS = [
  { label: 'Estação Mussurunga (Metrô / Terminal)', coords: [-12.9238, -38.3855] as [number, number] },
  { label: 'Shopping Paralela (Av. Luís Viana Filho)', coords: [-12.9460, -38.4120] as [number, number] },
  { label: 'Shopping da Bahia (Iguatemi / Av. ACM)', coords: [-12.9818, -38.4552] as [number, number] },
  { label: 'Aeroporto Internacional (São Cristóvão)', coords: [-12.9111, -38.3312] as [number, number] },
  { label: 'Farol da Barra (Orla Sul)', coords: [-13.0102, -38.5327] as [number, number] },
  { label: 'Pelourinho / Centro Histórico', coords: [-12.9716, -38.5080] as [number, number] },
  { label: 'Av. Tancredo Neves (Centro Empresarial)', coords: [-12.9839, -38.4510] as [number, number] },
];

// Cálculo de distância via Haversine (km)
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const GpsRiskMap: React.FC = () => {
  const {
    selectedVehicle,
    vehicles,
    geofenceConfig,
    updateGeofenceConfig,
    recordGeofenceBreach,
    triggerSimulation,
  } = useApp();
  const activeVehicle = selectedVehicle || vehicles?.[0] || DEFAULT_VEHICLES[0];

  // Leaflet Map & Layer References
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const geofenceCenterMarkerRef = useRef<L.Marker | null>(null);
  const fastRouteLayerRef = useRef<L.Polyline | null>(null);
  const safeRouteLayerRef = useRef<L.Polyline | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const workshopsLayerRef = useRef<L.LayerGroup | null>(null);
  const risksLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);

  // GPS Tracking State
  const [userCoords, setUserCoords] = useState<[number, number]>(SALVADOR_CENTER);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(5);
  const [gpsStatus, setGpsStatus] = useState<'LIVE' | 'FALLBACK' | 'SEARCHING'>('SEARCHING');
  const [isCenteredOnUser, setIsCenteredOnUser] = useState(true);

  // Map Data State
  const [risks, setRisks] = useState<RiskReport[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>(SALVADOR_WORKSHOPS);

  // Routing State & OSRM Result
  const [activeRouteType, setActiveRouteType] = useState<'SAFE' | 'FAST'>('SAFE');
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [destinationLabel, setDestinationLabel] = useState<string>('');
  const [routeResult, setRouteResult] = useState<{
    fast: { path: [number, number][]; km: string; min: number; warning: string };
    safe: { path: [number, number][]; km: string; min: number; benefit: string };
  } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Geofence Modal & Controls State
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [dismissedAlert, setDismissedAlert] = useState(false);
  const [fenceRadiusInput, setFenceRadiusInput] = useState<number>(geofenceConfig?.radius_km || 5);
  const [fenceNameInput, setFenceNameInput] = useState<string>(
    geofenceConfig?.name || 'Cerca Eletrônica CEEP Newton Sucupira (Mussurunga)'
  );
  const [fenceActionInput, setFenceActionInput] = useState<'ALERT_ONLY' | 'LOCK_IGNITION' | 'DISPATCH_SECURITY'>(
    geofenceConfig?.action_on_breach || 'ALERT_ONLY'
  );
  const [fencePushInput, setFencePushInput] = useState(geofenceConfig?.notify_push ?? true);
  const [fenceSmsInput, setFenceSmsInput] = useState(geofenceConfig?.notify_sms ?? true);

  // Interactive Pin / Modal State
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [selectedRiskPoint, setSelectedRiskPoint] = useState<RiskReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Visibility Toggles
  const [showRadius, setShowRadius] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showWorkshops, setShowWorkshops] = useState(true);
  const [showReports, setShowReports] = useState(true);

  // Report Form
  const [riskType, setRiskType] = useState<RiskType>('FURTO');
  const [description, setDescription] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // ==========================================
  // Geofencing Dynamic Calculations & Breach Detection
  // ==========================================
  const geofenceCenter: [number, number] = [
    geofenceConfig?.center_latitude ?? CEEP_NEWTON_SUCUPIRA_LOCATION[0],
    geofenceConfig?.center_longitude ?? CEEP_NEWTON_SUCUPIRA_LOCATION[1],
  ];

  const distanceToFenceKm = calculateHaversineDistance(
    userCoords[0],
    userCoords[1],
    geofenceCenter[0],
    geofenceCenter[1]
  );

  const isFenceBreached =
    Boolean(geofenceConfig?.enabled) && distanceToFenceKm > (geofenceConfig?.radius_km ?? 5);

  // Play gentle alert ping on breach
  const playBreachAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  useEffect(() => {
    recordGeofenceBreach(isFenceBreached, distanceToFenceKm);
    if (isFenceBreached) {
      setDismissedAlert(false);
      playBreachAudio();
    }
  }, [isFenceBreached, distanceToFenceKm]);

  const handleSimulateFenceBreach = () => {
    // Simula veículo saindo do raio de 5km de Mussurunga (indo para Bonocô / Av. Mario Leal Ferreira, ~13 km)
    const outsideCoords: [number, number] = [-12.9730, -38.4940];
    setUserCoords(outsideCoords);
    setIsCenteredOnUser(true);
    setDismissedAlert(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(outsideCoords, 13, { animate: true });
    }
    setFeedbackMsg('Simulação ativada: Veículo posicionado fora da cerca de Mussurunga (Bonocô - 13 KM).');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleSimulateReturnToMussurunga = () => {
    // Retorna veículo para o CEEP Newton Sucupira
    setUserCoords(CEEP_NEWTON_SUCUPIRA_LOCATION);
    setIsCenteredOnUser(true);
    setDismissedAlert(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(CEEP_NEWTON_SUCUPIRA_LOCATION, 14, { animate: true });
    }
    setFeedbackMsg('Simulação finalizada: Veículo retornado para o CEEP Newton Sucupira.');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // ==========================================
  // [BLOCO 1] Live GPS Tracking via navigator.geolocation
  // ==========================================
  const requestDeviceLocation = () => {
    setGpsStatus('SEARCHING');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const newCoords: [number, number] = [latitude, longitude];
          setUserCoords(newCoords);
          setGpsAccuracy(Math.round(accuracy) || 5);
          setGpsStatus('LIVE');
          setIsCenteredOnUser(true);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(newCoords, 14, { animate: true });
          }
        },
        (error) => {
          console.warn('Permissão de geolocalização negada ou indisponível:', error.message);
          setUserCoords(SALVADOR_CENTER);
          setGpsAccuracy(5);
          setGpsStatus('FALLBACK');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setUserCoords(SALVADOR_CENTER);
      setGpsStatus('FALLBACK');
    }
  };

  useEffect(() => {
    let watchId: number | null = null;

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserCoords([latitude, longitude]);
          setGpsAccuracy(Math.round(accuracy) || 5);
          setGpsStatus('LIVE');
        },
        (error) => {
          console.warn('Geolocation denied or failed, applying Salvador fallback:', error.message);
          setUserCoords(SALVADOR_CENTER);
          setGpsAccuracy(5);
          setGpsStatus('FALLBACK');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setUserCoords(SALVADOR_CENTER);
      setGpsStatus('FALLBACK');
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Fetch verified workshops and risks
  useEffect(() => {
    fetch('/api/workshops?status=VERIFIED')
      .then((r) => r.json())
      .then((data: Workshop[]) => {
        if (data && data.length > 0) {
          // Merge with Salvador workshops to guarantee coverage
          const combined = [...SALVADOR_WORKSHOPS];
          data.forEach((w) => {
            if (!combined.some((item) => item.id === w.id)) {
              combined.push(w);
            }
          });
          setWorkshops(combined);
        }
      })
      .catch(() => setWorkshops(SALVADOR_WORKSHOPS));

    fetch('/api/risk-reports')
      .then((r) => r.json())
      .then((data: RiskReport[]) => {
        if (data && data.length > 0) setRisks(data);
      })
      .catch(() => {});
  }, []);

  // ==========================================
  // [BLOCO 5] Initialize Leaflet Map (Dark Matter Tiles)
  // ==========================================
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: CEEP_NEWTON_SUCUPIRA_LOCATION,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // ESRI Dark Canvas Tile Layer (100% Gratuito - Sem necessidade de API Key)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          maxNativeZoom: 16,
        }
      ).addTo(map);

      // ESRI Dark Canvas Reference (Nomes de ruas, bairros e avenidas de Salvador)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          maxNativeZoom: 16,
          opacity: 0.85,
        }
      ).addTo(map);

      // Custom zoom control in bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Attribution
      L.control
        .attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('&copy; <a href="https://www.esri.com/">Esri</a>, Garmin, USGS &bull; CarCity IoT')
        .addTo(map);

      // Click on map allows setting custom destination
      map.on('click', (e: L.LeafletMouseEvent) => {
        handleSetDestination([e.latlng.lat, e.latlng.lng], 'Ponto Selecionado no Mapa');
      });

      mapInstanceRef.current = map;
      workshopsLayerRef.current = L.layerGroup().addTo(map);
      risksLayerRef.current = L.layerGroup().addTo(map);
      zonesLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ==========================================
  // [BLOCO 1 & 2] Render Vehicle Marker & 5KM Radius Circle
  // ==========================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Vehicle Marker Icon
    const vehicleIconHtml = `
      <div class="relative flex items-center justify-center">
        <span class="animate-ping absolute -inset-1.5 rounded-full bg-[#5DA9E9] opacity-75"></span>
        <div class="w-10 h-10 rounded-full bg-[#12273F] text-[#5DA9E9] border-2 border-[#5DA9E9] flex items-center justify-center shadow-[0_0_15px_rgba(93,169,233,0.6)]">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2m14 0a2 2 0 100 4 2 2 0 000-4zm-12 0a2 2 0 100 4 2 2 0 000-4z"/>
          </svg>
        </div>
      </div>
    `;

    const vehicleIcon = L.divIcon({
      html: vehicleIconHtml,
      className: 'carcity-vehicle-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const vehiclePopupHtml = `
      <div style="font-family: inherit; font-size: 12px; color: #F1F5F9; background: #12273F; padding: 6px; border-radius: 8px; min-width: 230px;">
        <strong style="color: #5DA9E9; display: block; font-size: 13px;">Seu Veículo: ${activeVehicle.plate || 'ABC-1023'}</strong>
        <span style="color: #FFFFFF; font-weight: 600; font-size: 11px; display: block; margin-top: 2px;">CEEP Newton Sucupira (Mussurunga, Setor F)</span>
        <span style="font-family: monospace; color: #9FB3C8; font-size: 11px;">${activeVehicle.brand} ${activeVehicle.model}</span><br/>
        <span style="color: #2FA67A; font-weight: bold; font-size: 11px;">● Raio de Segurança Ativo (5KM - Mussurunga & Paralela)</span>
      </div>
    `;

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLatLng(userCoords);
      vehicleMarkerRef.current.setPopupContent(vehiclePopupHtml);
    } else {
      vehicleMarkerRef.current = L.marker(userCoords, { icon: vehicleIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(vehiclePopupHtml, { className: 'carcity-custom-popup' });
    }

    // Geofence Perimeter Circle & Center Pin
    if (showRadius && geofenceConfig?.enabled) {
      const radiusMeters = (geofenceConfig.radius_km || 5) * 1000;
      const circleStyle = isFenceBreached
        ? {
            color: '#E5484D',
            fillColor: '#E5484D',
            fillOpacity: 0.12,
            weight: 2.5,
            dashArray: '4, 4',
          }
        : {
            color: '#3A76C2',
            fillColor: '#3A76C2',
            fillOpacity: 0.06,
            weight: 2,
            dashArray: '6, 8',
          };

      if (radiusCircleRef.current) {
        radiusCircleRef.current.setLatLng(geofenceCenter);
        radiusCircleRef.current.setRadius(radiusMeters);
        radiusCircleRef.current.setStyle(circleStyle);
      } else {
        radiusCircleRef.current = L.circle(geofenceCenter, {
          radius: radiusMeters,
          ...circleStyle,
        }).addTo(map);
      }

      // Geofence Center Pin
      const centerPinHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="w-8 h-8 rounded-full bg-[#12273F] text-[#5DA9E9] border-2 border-[#5DA9E9] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <span class="absolute -bottom-5 px-1.5 py-0.5 rounded bg-[#0B1A2E]/90 text-[8px] font-bold text-[#5DA9E9] border border-[#5DA9E9]/40 whitespace-nowrap">
            Centro Cerca
          </span>
        </div>
      `;
      const centerPinIcon = L.divIcon({
        html: centerPinHtml,
        className: 'carcity-geofence-center-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const centerPopupHtml = `
        <div style="font-family: inherit; font-size: 12px; color: #F1F5F9; background: #12273F; padding: 6px; border-radius: 8px; min-width: 220px;">
          <strong style="color: #5DA9E9; display: block; font-size: 12px;">🛡️ Centro da Cerca Eletrônica</strong>
          <span style="color: #FFFFFF; font-weight: bold; font-size: 11px;">${geofenceConfig.center_label}</span><br/>
          <span style="color: #9FB3C8; font-size: 10px;">Raio Permitido: ${geofenceConfig.radius_km} KM</span><br/>
          <span style="color: ${isFenceBreached ? '#E5484D' : '#2FA67A'}; font-weight: bold; font-size: 11px;">
            ${isFenceBreached ? `⚠️ VEÍCULO FORA DA CERCA (${distanceToFenceKm.toFixed(1)} km)` : `● Veículo Seguro no Perímetro (${distanceToFenceKm.toFixed(1)} km)`}
          </span>
        </div>
      `;

      if (geofenceCenterMarkerRef.current) {
        geofenceCenterMarkerRef.current.setLatLng(geofenceCenter);
        geofenceCenterMarkerRef.current.setPopupContent(centerPopupHtml);
      } else {
        geofenceCenterMarkerRef.current = L.marker(geofenceCenter, {
          icon: centerPinIcon,
          zIndexOffset: 950,
        })
          .addTo(map)
          .bindPopup(centerPopupHtml, { className: 'carcity-custom-popup' });
      }
    } else {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.remove();
        radiusCircleRef.current = null;
      }
      if (geofenceCenterMarkerRef.current) {
        geofenceCenterMarkerRef.current.remove();
        geofenceCenterMarkerRef.current = null;
      }
    }

    if (isCenteredOnUser) {
      map.setView(userCoords, map.getZoom() || 14, { animate: true });
    }
  }, [userCoords, activeVehicle, showRadius, isCenteredOnUser, geofenceConfig, isFenceBreached]);

  // ==========================================
  // [BLOCO 2] Render Salvador Risk Zones Polygons
  // ==========================================
  useEffect(() => {
    const zonesGroup = zonesLayerRef.current;
    if (!zonesGroup) return;

    zonesGroup.clearLayers();

    if (!showRiskZones) return;

    SALVADOR_RISK_ZONES.forEach((zone) => {
      const polygon = L.polygon(zone.polygon, {
        color: zone.borderColor,
        fillColor: zone.color,
        fillOpacity: zone.level === 'CRITICAL' ? 0.3 : 0.22,
        weight: 2,
        dashArray: zone.level === 'CRITICAL' ? '4, 4' : undefined,
      }).addTo(zonesGroup);

      polygon.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #F1F5F9; background: #12273F; padding: 6px; border-radius: 8px; max-width: 240px;">
          <div style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: ${
            zone.level === 'CRITICAL' ? 'rgba(229,72,77,0.25)' : 'rgba(224,159,62,0.25)'
          }; color: ${zone.color}; margin-bottom: 4px;">
            ${zone.badge}
          </div>
          <strong style="display: block; color: #FFFFFF; font-size: 12px; margin-bottom: 4px;">${zone.name}</strong>
          <p style="color: #9FB3C8; font-size: 11px; margin: 0; line-height: 1.4;">${zone.description}</p>
        </div>
      `);
    });
  }, [showRiskZones]);

  // ==========================================
  // [BLOCO 4] Render Verified Workshops Markers
  // ==========================================
  useEffect(() => {
    const wsGroup = workshopsLayerRef.current;
    if (!wsGroup) return;

    wsGroup.clearLayers();

    if (!showWorkshops) return;

    workshops.forEach((ws) => {
      const wsIconHtml = `
        <div class="relative group cursor-pointer">
          <div class="w-9 h-9 rounded-full bg-[#2FA67A] text-white flex items-center justify-center shadow-[0_0_12px_rgba(47,166,122,0.6)] border-2 border-white hover:scale-110 transition-transform">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#0B1A2E]/90 text-[9px] font-bold text-[#2FA67A] whitespace-nowrap border border-[#2FA67A]/40 shadow">
            ✓ Anti-Fraude
          </div>
        </div>
      `;

      const wsIcon = L.divIcon({
        html: wsIconHtml,
        className: 'carcity-workshop-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([ws.latitude, ws.longitude], { icon: wsIcon }).addTo(wsGroup);
      marker.on('click', () => {
        setSelectedWorkshop(ws);
        setSelectedRiskPoint(null);
      });
    });
  }, [workshops, showWorkshops]);

  // ==========================================
  // Render Community Risk Reports Pins
  // ==========================================
  useEffect(() => {
    const risksGroup = risksLayerRef.current;
    if (!risksGroup) return;

    risksGroup.clearLayers();

    if (!showReports) return;

    risks.forEach((r) => {
      const ringColor =
        r.reporter_plan === 'ADVANCED'
          ? 'border-[#D4AF37]'
          : r.reporter_plan === 'STANDARD'
          ? 'border-[#2FA67A]'
          : 'border-[#64748B]';

      const riskIconHtml = `
        <div class="flex flex-col items-center cursor-pointer hover:scale-125 transition-transform">
          <div class="w-8 h-8 rounded-full bg-[#12273F] text-[#E09F3E] border-2 ${ringColor} flex items-center justify-center shadow-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <span class="px-1.5 py-0.2 rounded bg-[#0B1A2E]/90 text-[8px] font-bold text-[#E09F3E] border border-[#E09F3E]/40 mt-1 uppercase whitespace-nowrap">
            ${r.risk_type}
          </span>
        </div>
      `;

      const riskIcon = L.divIcon({
        html: riskIconHtml,
        className: 'carcity-risk-pin',
        iconSize: [32, 40],
        iconAnchor: [16, 20],
      });

      const marker = L.marker([r.latitude, r.longitude], { icon: riskIcon }).addTo(risksGroup);
      marker.on('click', () => {
        setSelectedRiskPoint(r);
        setSelectedWorkshop(null);
      });
    });
  }, [risks, showReports]);

  // ==========================================
  // [BLOCO 2] Traçado de Rotas Reais pelas Ruas via OSRM (Open Source Routing Machine)
  // ==========================================
  useEffect(() => {
    if (!destinationCoords) {
      setRouteResult(null);
      return;
    }

    let isMounted = true;
    setIsCalculatingRoute(true);

    const calculateOsrmStreetRoutes = async () => {
      const [startLat, startLng] = userCoords;
      const [destLat, destLng] = destinationCoords;

      try {
        // Chamada oficial à API pública do OSRM para traçado real nas ruas de Salvador
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=true`;
        const res = await fetch(osrmUrl);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const primaryRoute = data.routes[0];
          // Converte [lng, lat] GeoJSON para [lat, lng] Leaflet
          const fastPath: [number, number][] = primaryRoute.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          const fastKm = (primaryRoute.distance / 1000).toFixed(1);
          const fastMin = Math.max(3, Math.round(primaryRoute.duration / 60));

          let safePath: [number, number][] = fastPath;
          let safeKm = fastKm;
          let safeMin = fastMin;

          // Se o OSRM retornar rota alternativa viária, utilize-a para a rota segura
          if (data.routes.length > 1) {
            const altRoute = data.routes[1];
            safePath = altRoute.geometry.coordinates.map(
              ([lng, lat]: [number, number]) => [lat, lng]
            );
            safeKm = (altRoute.distance / 1000).toFixed(1);
            safeMin = Math.max(4, Math.round(altRoute.duration / 60));
          } else {
            // Se houver apenas 1 rota direta, calcula uma rota alternativa passando por corredor monitorado
            // Waypoint seguro nas avenidas arteriais de Salvador (Orla/Magalhães Neto/Centenário)
            const safeWaypoint: [number, number] =
              destLat > startLat
                ? [-12.9850, -38.4550] // Av. Tancredo Neves / Magalhães Neto
                : [-13.0040, -38.4860]; // Orla Rio Vermelho / Pituba

            try {
              const safeUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${safeWaypoint[1]},${safeWaypoint[0]};${destLng},${destLat}?overview=full&geometries=geojson`;
              const safeRes = await fetch(safeUrl);
              const safeData = await safeRes.json();
              if (safeData.code === 'Ok' && safeData.routes && safeData.routes.length > 0) {
                const sRoute = safeData.routes[0];
                safePath = sRoute.geometry.coordinates.map(
                  ([lng, lat]: [number, number]) => [lat, lng]
                );
                safeKm = (sRoute.distance / 1000).toFixed(1);
                safeMin = Math.max(5, Math.round(sRoute.duration / 60));
              }
            } catch {
              // Mantém safePath como alternativa
            }
          }

          if (isMounted) {
            setRouteResult({
              fast: {
                path: fastPath,
                km: fastKm,
                min: fastMin,
                warning: 'Trajeto viário direto pelas avenidas principais de Salvador',
              },
              safe: {
                path: safePath,
                km: safeKm,
                min: safeMin,
                benefit: 'Rota otimizada nas vias monitoradas de Salvador • 100% pelas ruas',
              },
            });
          }
          return;
        }
      } catch (err) {
        console.warn('Erro na requisição ao OSRM:', err);
      }

      // Fallback em caso de indisponibilidade momentânea do serviço público OSRM
      if (isMounted) {
        const directDist = calculateHaversineDistance(startLat, startLng, destLat, destLng);
        const estKm = (directDist * 1.25).toFixed(1);
        const estMin = Math.max(5, Math.round(Number(estKm) * 2.2));
        setRouteResult({
          fast: {
            path: [[startLat, startLng], [destLat, destLng]],
            km: estKm,
            min: estMin,
            warning: 'Trajeto calculado para malha viária',
          },
          safe: {
            path: [[startLat, startLng], [destLat, destLng]],
            km: (directDist * 1.35).toFixed(1),
            min: Math.max(7, Math.round(Number(estKm) * 2.5)),
            benefit: 'Rota otimizada para segurança nas vias de Salvador',
          },
        });
      }
    };

    calculateOsrmStreetRoutes().finally(() => {
      if (isMounted) setIsCalculatingRoute(false);
    });

    return () => {
      isMounted = false;
    };
  }, [userCoords, destinationCoords]);

  // Atualiza desenho das rotas no Leaflet
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing route polylines
    if (fastRouteLayerRef.current) {
      fastRouteLayerRef.current.remove();
      fastRouteLayerRef.current = null;
    }
    if (safeRouteLayerRef.current) {
      safeRouteLayerRef.current.remove();
      safeRouteLayerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    if (!destinationCoords || !routeResult) return;

    // Marcador de Destino
    const destIconHtml = `
      <div class="relative flex flex-col items-center">
        <div class="w-8 h-8 rounded-full bg-[#E5484D] text-white flex items-center justify-center shadow-[0_0_12px_rgba(229,72,77,0.7)] border-2 border-white">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
      </div>
    `;
    const destIcon = L.divIcon({
      html: destIconHtml,
      className: 'carcity-dest-pin',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    destinationMarkerRef.current = L.marker(destinationCoords, { icon: destIcon })
      .addTo(map)
      .bindPopup(
        `<strong style="color: #FFFFFF; font-size: 12px;">Destino:</strong><br/><span style="color: #9FB3C8;">${destinationLabel}</span>`
      );

    // Linha Rápida (Azul #3A76C2)
    if (routeResult.fast.path.length > 0) {
      fastRouteLayerRef.current = L.polyline(routeResult.fast.path, {
        color: '#3A76C2',
        weight: activeRouteType === 'FAST' ? 6 : 3,
        opacity: activeRouteType === 'FAST' ? 0.95 : 0.35,
        dashArray: activeRouteType === 'FAST' ? undefined : '5, 8',
      }).addTo(map);
    }

    // Linha Segura (Verde Protegido #2FA67A)
    if (routeResult.safe.path.length > 0) {
      safeRouteLayerRef.current = L.polyline(routeResult.safe.path, {
        color: '#2FA67A',
        weight: activeRouteType === 'SAFE' ? 6 : 3,
        opacity: activeRouteType === 'SAFE' ? 0.95 : 0.35,
        dashArray: activeRouteType === 'SAFE' ? undefined : '5, 8',
      }).addTo(map);
    }

    // Ajusta o enquadramento do mapa para caber a rota completa pelas ruas
    const activePath = activeRouteType === 'SAFE' ? routeResult.safe.path : routeResult.fast.path;
    if (activePath.length > 1) {
      const bounds = L.latLngBounds(activePath);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [destinationCoords, routeResult, activeRouteType, destinationLabel]);

  // Handler para definir destino e recalcular rotas
  const handleSetDestination = (coords: [number, number], label: string) => {
    setDestinationCoords(coords);
    setDestinationLabel(label);
    setIsCenteredOnUser(false);
    setIsSearchOpen(false);
  };

  // [BLOCO 3] Botão de Limpeza Instantânea de Rota
  const handleClearRoute = () => {
    setDestinationCoords(null);
    setDestinationLabel('');
    setRouteResult(null);
    if (fastRouteLayerRef.current) {
      fastRouteLayerRef.current.remove();
      fastRouteLayerRef.current = null;
    }
    if (safeRouteLayerRef.current) {
      safeRouteLayerRef.current.remove();
      safeRouteLayerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }
    setIsCenteredOnUser(true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(userCoords, 13, { animate: true });
    }
  };

  // Handler para Navegar Até Esta Oficina em 1 Clique (Bloco 4.3)
  const handleNavigateToWorkshop = (ws: Workshop) => {
    handleSetDestination([ws.latitude, ws.longitude], ws.nome_fantasia);
    setActiveRouteType('SAFE'); // Sempre priorizar rota segura para oficinas
    setSelectedWorkshop(null);
  };

  // Recentralizar mapa na posição do veículo
  const handleRecenter = () => {
    setIsCenteredOnUser(true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(userCoords, 14, { animate: true });
    }
  };

  // Submissão do relatório de risco
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lgpdConsent) {
      alert('É necessário conceder o consentimento LGPD para reportar localização.');
      return;
    }
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      const lat = userCoords[0] + (Math.random() - 0.5) * 0.005;
      const lng = userCoords[1] + (Math.random() - 0.5) * 0.005;

      const res = await fetch('/api/risk-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risk_type: riskType,
          latitude: lat,
          longitude: lng,
          description,
          lgpd_consent: true,
        }),
      });

      if (res.ok) {
        setIsReportModalOpen(false);
        setDescription('');
        setLgpdConsent(false);
        setFeedbackMsg('Ocorrência registrada e enviada à moderação com sucesso.');
        setTimeout(() => setFeedbackMsg(null), 4000);

        // Recarrega lista
        const refreshed = await (await fetch('/api/risk-reports')).json();
        setRisks(refreshed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in relative">
      {/* ======================================================== */}
      {/* Top Header Bar & Controles */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3A76C2]/20 border border-[#3A76C2]/40 flex items-center justify-center text-[#5DA9E9] shadow">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              GPS Ao Vivo & Rotas Seguras — CEEP Newton Sucupira (Mussurunga)
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/30">
                LIVE MAP
              </span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#9FB3C8] mt-0.5">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    gpsStatus === 'LIVE' ? 'bg-[#2FA67A] animate-pulse' : 'bg-[#E09F3E]'
                  }`}
                />
                <span className={gpsStatus === 'LIVE' ? 'text-[#2FA67A] font-semibold' : 'text-[#E09F3E]'}>
                  {gpsStatus === 'LIVE'
                    ? '🟢 GPS Ativo (Sinal Real do Dispositivo)'
                    : '🟠 Padrão: CEEP Newton Sucupira (Mussurunga, Setor F)'}
                </span>
              </span>
              <span>&bull;</span>
              <span className="font-mono text-[#5DA9E9]">Precisão: &plusmn;{gpsAccuracy}m</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* [BLOCO 1] Botão de Ação Rápida: Usar Minha Localização Real */}
          <button
            onClick={requestDeviceLocation}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border shadow ${
              gpsStatus === 'LIVE'
                ? 'bg-[#2FA67A]/20 text-[#2FA67A] border-[#2FA67A]/40'
                : 'bg-[#0B1A2E] hover:bg-[#1E3A5F] text-[#5DA9E9] border-[#3A76C2]/40'
            }`}
            title="Solicitar permissão e obter GPS real do dispositivo"
          >
            <MapPin className="w-3.5 h-3.5 text-[#5DA9E9]" />
            <span>📍 Usar Minha Localização Real</span>
          </button>

          {/* Botão Cerca Eletrônica (Geofencing) */}
          <button
            onClick={() => setIsGeofenceModalOpen(true)}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border shadow ${
              isFenceBreached
                ? 'bg-[#E5484D] text-white border-[#E5484D] animate-pulse'
                : 'bg-[#0B1A2E] hover:bg-[#1E3A5F] text-white border-[#223B57] hover:border-[#5DA9E9]'
            }`}
            title="Configurar perímetro de cerca eletrônica (Geofencing)"
          >
            {isFenceBreached ? (
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-[#5DA9E9]" />
            )}
            <span>
              {isFenceBreached
                ? `⚠️ Cerca Violada (+${distanceToFenceKm.toFixed(1)} km)`
                : `🛡️ Cerca: ${geofenceConfig?.radius_km || 5} KM`}
            </span>
          </button>

          {/* Botão de Teste / Simulação de Cerca */}
          {isFenceBreached ? (
            <button
              onClick={handleSimulateReturnToMussurunga}
              className="px-3 py-2 rounded-xl bg-[#2FA67A] hover:bg-[#23865f] text-white font-bold text-xs flex items-center gap-1.5 shadow"
              title="Restaurar simulação de volta a Mussurunga"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Restaurar a Mussurunga</span>
            </button>
          ) : (
            <button
              onClick={handleSimulateFenceBreach}
              className="px-3 py-2 rounded-xl bg-[#0B1A2E] hover:bg-[#E5484D]/20 text-[#E5484D] hover:border-[#E5484D] border border-[#223B57] font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Simular veículo saindo do raio de 5 KM de Mussurunga"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#E5484D]" />
              <span>Simular Saída (&gt;5km)</span>
            </button>
          )}

          {/* Botão de Pesquisa de Rota */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border ${
              destinationCoords
                ? 'bg-[#2FA67A] text-white border-[#2FA67A]'
                : 'bg-[#0B1A2E] hover:bg-[#1E3A5F] text-white border-[#223B57]'
            }`}
          >
            <RouteIcon className="w-3.5 h-3.5 text-[#5DA9E9]" />
            <span>{destinationCoords ? 'Rota Ativa' : 'Calcular Rota'}</span>
          </button>

          {/* [BLOCO 2] Botão Rápido para Limpar Rota se houver destino traçado */}
          {destinationCoords && (
            <button
              onClick={handleClearRoute}
              className="px-3 py-2 rounded-xl bg-[#E5484D]/15 hover:bg-[#E5484D] text-[#E5484D] hover:text-white font-bold text-xs transition-colors border border-[#E5484D]/30 flex items-center gap-1.5"
              title="Remover linha da rota e marcador de destino"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Rota</span>
            </button>
          )}

          {/* Botão Reportar Ocorrência */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#E09F3E] hover:bg-[#B54708] text-[#0B1A2E] hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Reportar
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* Banner de Violação de Cerca Eletrônica (Geofence Breach) */}
      {/* ======================================================== */}
      {isFenceBreached && !dismissedAlert && (
        <div className="p-4 rounded-2xl bg-[#E5484D]/15 border-2 border-[#E5484D] shadow-[0_0_25px_rgba(229,72,77,0.35)] space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E5484D] text-white flex items-center justify-center shadow-lg animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E5484D] text-white">
                    🚨 ALERTA DE SEGURANÇA: CERCA ELETRÔNICA VIOLADA
                  </span>
                  <span className="text-xs text-[#9FB3C8] font-mono">
                    {new Date().toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Veículo fora do raio de {geofenceConfig?.radius_km || 5}.0 KM de Mussurunga!
                </h3>
                <p className="text-xs text-[#F1F5F9]/80 mt-0.5">
                  Distância registrada: <strong className="text-[#E5484D] font-mono">{distanceToFenceKm.toFixed(1)} km</strong> do CEEP Newton Sucupira (Setor F).
                  {geofenceConfig?.action_on_breach === 'LOCK_IGNITION' && ' Protocolo de bloqueio preventivo de ignição pronto.'}
                  {geofenceConfig?.action_on_breach === 'DISPATCH_SECURITY' && ' Notificação enviada à central de apoio operacional.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleRecenter}
                className="px-3 py-1.5 rounded-xl bg-[#12273F] hover:bg-[#1E3A5F] text-white text-xs font-bold border border-[#223B57] flex items-center gap-1.5"
              >
                <Crosshair className="w-3.5 h-3.5 text-[#5DA9E9]" />
                Ver no Mapa
              </button>
              <button
                onClick={handleSimulateReturnToMussurunga}
                className="px-3 py-1.5 rounded-xl bg-[#2FA67A] hover:bg-[#23865f] text-white text-xs font-bold flex items-center gap-1.5 shadow"
                title="Restaurar simulação para o CEEP Newton Sucupira"
              >
                <Check className="w-3.5 h-3.5" />
                Retornar a Mussurunga
              </button>
              <button
                onClick={() => setIsGeofenceModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#0B1A2E] hover:bg-[#1E3A5F] text-[#5DA9E9] text-xs font-bold border border-[#3A76C2]/40 flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                Ajustar Cerca
              </button>
              <button
                onClick={() => setDismissedAlert(true)}
                className="p-1.5 rounded-lg text-[#9FB3C8] hover:text-white hover:bg-white/10"
                title="Dispensar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-[#2FA67A]/20 border border-[#2FA67A] text-white text-xs flex items-center gap-2 shadow">
          <CheckCircle2 className="w-4 h-4 text-[#2FA67A]" />
          {feedbackMsg}
        </div>
      )}

      {/* ======================================================== */}
      {/* [BLOCO 3] Painel Suspenso de Destino & Comparativo de Rotas */}
      {/* ======================================================== */}
      {isSearchOpen && (
        <div className="p-4 rounded-2xl bg-[#12273F] border border-[#3A76C2] shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-[#5DA9E9]" />
              Para onde deseja ir em Salvador?
            </h3>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-[#9FB3C8] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Digite um endereço ou selecione um destino sugerido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white text-xs placeholder-[#64748B] focus:outline-none focus:border-[#5DA9E9]"
            />
          </div>

          {/* Destinos Populares Rápidos */}
          <div>
            <span className="text-[10px] text-[#9FB3C8] uppercase font-mono tracking-wider block mb-2">
              Destinos Frequentes em Salvador:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {POPULAR_DESTINATIONS.filter((d) =>
                d.label.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((d) => (
                <button
                  key={d.label}
                  onClick={() => handleSetDestination(d.coords, d.label)}
                  className="px-3 py-2 rounded-xl bg-[#0B1A2E] hover:bg-[#1E3A5F] border border-[#223B57] hover:border-[#5DA9E9] text-left text-xs text-white transition-all flex items-center justify-between group"
                >
                  <span className="truncate">{d.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5DA9E9] opacity-60 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Card Flutuante de Rota Ativa (Com Seletor Rápida vs Segura & Links Waze / Google Maps) */}
      {destinationCoords && (
        <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-2xl space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#9FB3C8]">Destino Selecionado:</span>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#E5484D]" />
                {destinationLabel}
              </h4>
            </div>

            <button
              onClick={handleClearRoute}
              className="px-3.5 py-1.5 rounded-lg bg-[#E5484D]/15 hover:bg-[#E5484D] text-[#E5484D] hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5 border border-[#E5484D]/30"
              title="Apagar traçado do mapa e pino de destino"
            >
              <X className="w-3.5 h-3.5" />
              <span>✖ Limpar Rota / Destino</span>
            </button>
          </div>

          {isCalculatingRoute && (
            <div className="p-3 rounded-xl bg-[#1E3A5F]/40 border border-[#3A76C2]/50 text-[#5DA9E9] text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#5DA9E9]" />
              <span>Traçando trajeto em tempo real pelas ruas e avenidas de Salvador via OSRM...</span>
            </div>
          )}

          {routeResult && (
            <>
              {/* Seletor de Algoritmo de Rota */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* 🛡️ ROTA MAIS SEGURA */}
                <div
                  onClick={() => setActiveRouteType('SAFE')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    activeRouteType === 'SAFE'
                      ? 'bg-[#2FA67A]/15 border-[#2FA67A] shadow-[0_0_15px_rgba(47,166,122,0.25)]'
                      : 'bg-[#0B1A2E] border-[#223B57] hover:border-[#2FA67A]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#2FA67A] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      🛡️ Rota Mais Segura (Recomendada)
                    </span>
                    {activeRouteType === 'SAFE' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2FA67A] text-white">
                        ATIVADA
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3 text-white">
                    <span className="text-lg font-bold font-mono">{routeResult.safe.min} min</span>
                    <span className="text-xs text-[#9FB3C8] font-mono">{routeResult.safe.km} km</span>
                  </div>
                  <p className="text-[11px] text-[#2FA67A] mt-1 font-medium leading-relaxed">
                    {routeResult.safe.benefit}
                  </p>
                </div>

                {/* ⚡ ROTA MAIS RÁPIDA */}
                <div
                  onClick={() => setActiveRouteType('FAST')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    activeRouteType === 'FAST'
                      ? 'bg-[#3A76C2]/15 border-[#3A76C2] shadow-[0_0_15px_rgba(58,118,194,0.25)]'
                      : 'bg-[#0B1A2E] border-[#223B57] hover:border-[#3A76C2]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#5DA9E9] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      ⚡ Rota Mais Rápida (Direta)
                    </span>
                    {activeRouteType === 'FAST' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3A76C2] text-white">
                        ATIVADA
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3 text-white">
                    <span className="text-lg font-bold font-mono">{routeResult.fast.min} min</span>
                    <span className="text-xs text-[#9FB3C8] font-mono">{routeResult.fast.km} km</span>
                  </div>
                  <p className="text-[11px] text-[#E09F3E] mt-1 font-medium leading-relaxed">
                    ⚠️ {routeResult.fast.warning}
                  </p>
                </div>
              </div>

              {/* [BLOCO 4] Links para Navegação em Aplicativos Externos (Waze & Google Maps) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#223B57]">
                <span className="text-[11px] text-[#9FB3C8]">
                  Navegar com GPS passo a passo no seu aplicativo:
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://waze.com/ul?ll=${destinationCoords[0]},${destinationCoords[1]}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#33CCFF]/15 hover:bg-[#33CCFF] text-[#33CCFF] hover:text-[#0B1A2E] text-xs font-bold transition-all flex items-center gap-1.5 border border-[#33CCFF]/30 shadow"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Abrir no Waze</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${destinationCoords[0]},${destinationCoords[1]}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#4285F4]/15 hover:bg-[#4285F4] text-[#4285F4] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-[#4285F4]/30 shadow"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Abrir no Google Maps</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* [BLOCO 5] Área Interativa do Mapa Leaflet */}
      {/* ======================================================== */}
      <div className="relative w-full h-[580px] rounded-2xl overflow-hidden border border-[#223B57] bg-[#0B1A2E] shadow-2xl">
        {/* Container do Mapa Leaflet */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Botão Flutuante de Recentralizar (Topo Esquerdo) */}
        <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2">
          <button
            onClick={handleRecenter}
            title="Recentralizar no CEEP Newton Sucupira (Mussurunga, Setor F)"
            className="p-2.5 rounded-xl bg-[#12273F]/90 hover:bg-[#3A76C2] text-white border border-[#223B57] shadow-xl transition-all flex items-center gap-1.5 text-xs font-bold backdrop-blur-md"
          >
            <Crosshair className="w-4 h-4 text-[#5DA9E9]" />
            <span>Centralizar Veículo</span>
          </button>
        </div>

        {/* Camadas & Filtros de Exibição (Topo Direito) */}
        <div className="absolute top-4 right-4 z-[500] flex items-center gap-1.5 p-1.5 rounded-xl bg-[#0B1A2E]/90 border border-[#223B57] backdrop-blur-md shadow-xl text-xs">
          <button
            onClick={() => setShowRiskZones(!showRiskZones)}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              showRiskZones ? 'bg-[#E5484D]/20 text-[#E5484D] border border-[#E5484D]/40' : 'text-[#64748B]'
            }`}
          >
            Zonas de Risco
          </button>
          <button
            onClick={() => setShowWorkshops(!showWorkshops)}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              showWorkshops ? 'bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/40' : 'text-[#64748B]'
            }`}
          >
            Oficinas
          </button>
          <button
            onClick={() => setShowRadius(!showRadius)}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
              showRadius ? 'bg-[#3A76C2]/20 text-[#5DA9E9] border border-[#3A76C2]/40' : 'text-[#64748B]'
            }`}
          >
            Raio 5KM
          </button>
        </div>

        {/* ======================================================== */}
        {/* [BLOCO 4] Card Suspenso da Oficina Selecionada */}
        {/* ======================================================== */}
        {selectedWorkshop && (
          <div className="absolute bottom-6 right-6 z-[600] w-80 p-4 rounded-2xl bg-[#12273F]/95 border border-[#2FA67A] shadow-2xl backdrop-blur-md animate-fade-in text-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <span className="px-2 py-0.5 rounded bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/30 text-[10px] font-bold font-mono">
                ✓ SELO ANTI-FRAUDE VERIFIED
              </span>
              <button
                onClick={() => setSelectedWorkshop(null)}
                className="text-[#9FB3C8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">{selectedWorkshop.nome_fantasia}</h4>
              <p className="text-[#9FB3C8] text-[11px] mt-0.5">{selectedWorkshop.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 py-1 text-[11px]">
              <div className="p-2 rounded-lg bg-[#0B1A2E] border border-[#223B57]">
                <span className="text-[#9FB3C8] block text-[10px]">Distância GPS:</span>
                <strong className="text-white font-mono text-xs">
                  {calculateHaversineDistance(
                    userCoords[0],
                    userCoords[1],
                    selectedWorkshop.latitude,
                    selectedWorkshop.longitude
                  ).toFixed(1)}{' '}
                  km
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-[#0B1A2E] border border-[#223B57]">
                <span className="text-[#9FB3C8] block text-[10px]">Avaliação da Rede:</span>
                <strong className="text-[#D4AF37] font-mono text-xs">4.9 ★★★★★</strong>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#D4AF37] font-semibold block">
                ★ Benefício CarCity: Até 20% de Desconto para Clientes
              </span>
            </div>

            {/* BOTÃO MESTRE: [Traçar Rota no Mapa] */}
            <button
              onClick={() => handleNavigateToWorkshop(selectedWorkshop)}
              className="w-full py-2.5 rounded-xl bg-[#2FA67A] hover:bg-[#23865f] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>Traçar Rota no Mapa (Ruas Reais)</span>
            </button>

            {/* Links para Navegação em Aplicativos Externos (Waze & Google Maps) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`https://waze.com/ul?ll=${selectedWorkshop.latitude},${selectedWorkshop.longitude}&navigate=yes`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-2.5 rounded-xl bg-[#33CCFF]/15 hover:bg-[#33CCFF] text-[#33CCFF] hover:text-[#0B1A2E] font-bold text-[11px] flex items-center justify-center gap-1 border border-[#33CCFF]/30 transition-all shadow text-center"
              >
                <span>🚗 Abrir no Waze</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedWorkshop.latitude},${selectedWorkshop.longitude}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-2.5 rounded-xl bg-[#4285F4]/15 hover:bg-[#4285F4] text-[#4285F4] hover:text-white font-bold text-[11px] flex items-center justify-center gap-1 border border-[#4285F4]/30 transition-all shadow text-center"
              >
                <span>🗺️ Google Maps</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>
        )}

        {/* Card Suspenso de Ocorrência de Risco Selecionada */}
        {selectedRiskPoint && (
          <div className="absolute bottom-6 right-6 z-[600] w-72 p-4 rounded-2xl bg-[#12273F]/95 border border-[#E09F3E] shadow-2xl backdrop-blur-md animate-fade-in text-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="px-2 py-0.5 rounded bg-[#E09F3E]/20 text-[#E09F3E] border border-[#E09F3E]/30 text-[10px] font-bold font-mono uppercase">
                Ocorrência: {selectedRiskPoint.risk_type}
              </span>
              <button
                onClick={() => setSelectedRiskPoint(null)}
                className="text-[#9FB3C8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white text-xs leading-relaxed">{selectedRiskPoint.description}</p>
            <div className="text-[10px] text-[#9FB3C8] font-mono pt-1">
              Reportado por: {selectedRiskPoint.reporter_name || 'Condutor'} (Plano {selectedRiskPoint.reporter_plan || 'BASIC'})
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* Painel Inferior de Legenda do Mapa (Bloco 5) */}
        {/* ======================================================== */}
        <div className="absolute bottom-4 left-4 z-[500] p-3 rounded-xl bg-[#0B1A2E]/90 border border-[#223B57] backdrop-blur-md text-[11px] text-[#9FB3C8] space-y-1.5 shadow-xl max-w-xs">
          <div className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#5DA9E9]" />
            <span>Legenda do Mapa (Salvador - BA)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#5DA9E9] border border-white" />
            <span>Veículo / GPS ao Vivo & Raio de 5KM</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#2FA67A]" />
            <span>Oficina Credenciada (✓ Anti-Fraude)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#E5484D]" />
            <span>Zona Crítica: Paralela / Narandiba / Bonocô</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#E09F3E]" />
            <span>Zona de Atenção: Retiro / San Martin / Garibaldi</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-[#223B57] text-[10px]">
            <span className="w-3 h-1 bg-[#2FA67A] inline-block" />
            <span>Rota Segura (Verde)</span>
            <span className="w-3 h-1 bg-[#5DA9E9] inline-block ml-2" />
            <span>Rota Rápida (Azul)</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* [BLOCO 3] Mapeamento Dinâmico: Oficinas Próximas por Distância GPS */}
      {/* ======================================================== */}
      <div className="p-4 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2FA67A]" />
              Oficinas Credenciadas Mais Próximas do Seu GPS
            </h3>
            <p className="text-xs text-[#9FB3C8] mt-0.5">
              Ordenadas automaticamente pela menor distância a partir da sua localização atual ({userCoords[0].toFixed(4)}, {userCoords[1].toFixed(4)}).
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2FA67A]/20 text-[#2FA67A] border border-[#2FA67A]/30">
            {workshops.length} OFICINAS HOMOLOGADAS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {workshops
            .map((ws) => {
              const distanceKm = calculateHaversineDistance(
                userCoords[0],
                userCoords[1],
                ws.latitude,
                ws.longitude
              );
              return { ...ws, distanceKm };
            })
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .map((ws) => {
              const isSelected = selectedWorkshop?.id === ws.id;
              return (
                <div
                  key={ws.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#2FA67A]/15 border-[#2FA67A] shadow-[0_0_15px_rgba(47,166,122,0.3)]'
                      : 'bg-[#0B1A2E] border-[#223B57] hover:border-[#2FA67A]/50'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-[#2FA67A]/20 text-[#2FA67A] text-[9px] font-bold font-mono border border-[#2FA67A]/30">
                        ✓ Anti-Fraude Verified
                      </span>
                      <span className="text-xs font-mono font-bold text-[#5DA9E9] bg-[#5DA9E9]/10 px-2 py-0.5 rounded border border-[#5DA9E9]/20">
                        {ws.distanceKm.toFixed(1)} km de você
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white leading-tight">{ws.nome_fantasia}</h4>
                    <p className="text-[11px] text-[#9FB3C8] line-clamp-2">{ws.address}</p>

                    <div className="flex items-center gap-2 pt-1 text-[10px]">
                      <span className="text-[#D4AF37] font-semibold">★ {ws.rating || 4.9}</span>
                      <span className="text-[#64748B]">&bull;</span>
                      <span className="text-[#9FB3C8] font-mono">{ws.phone || '(71) 3345-6789'}</span>
                    </div>
                  </div>

                  <div className="pt-3 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedWorkshop(ws);
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.setView([ws.latitude, ws.longitude], 15, { animate: true });
                        }
                      }}
                      className="flex-1 min-w-[70px] py-1.5 rounded-lg bg-[#1E3A5F] hover:bg-[#2B4C7E] text-white text-[11px] font-semibold transition-colors"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleNavigateToWorkshop(ws)}
                      className="flex-1 min-w-[95px] py-1.5 rounded-lg bg-[#2FA67A] hover:bg-[#23865f] text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Traçar Rota</span>
                    </button>
                    <a
                      href={`https://waze.com/ul?ll=${ws.latitude},${ws.longitude}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 rounded-lg bg-[#33CCFF]/15 hover:bg-[#33CCFF] text-[#33CCFF] hover:text-[#0B1A2E] text-[10px] font-bold transition-all border border-[#33CCFF]/30 flex items-center justify-center"
                      title="Navegar no Waze"
                    >
                      Waze
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${ws.latitude},${ws.longitude}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 rounded-lg bg-[#4285F4]/15 hover:bg-[#4285F4] text-[#4285F4] hover:text-white text-[10px] font-bold transition-all border border-[#4285F4]/30 flex items-center justify-center"
                      title="Navegar no Google Maps"
                    >
                      Maps
                    </a>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* Modal: Reportar Ocorrência na Via com Consentimento LGPD */}
      {/* ======================================================== */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#12273F] border border-[#223B57] shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#E09F3E]" />
                Reportar Ocorrência na Via
              </h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-[#9FB3C8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#9FB3C8] uppercase mb-1">
                  Tipo de Risco:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['FURTO', 'ROUBO', 'OUTRO'] as RiskType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setRiskType(t)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        riskType === t
                          ? 'bg-[#E09F3E] text-[#0B1A2E] border-[#E09F3E]'
                          : 'bg-[#0B1A2E] text-[#9FB3C8] border-[#223B57] hover:border-[#E09F3E]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9FB3C8] uppercase mb-1">
                  Descrição do Ocorrido:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva o que ocorreu (ex.: tentativa de furto de estepe no estacionamento próximo ao Imbuí)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white text-xs placeholder-[#64748B] focus:outline-none focus:border-[#E09F3E]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57] space-y-2">
                <label className="flex items-start gap-2 cursor-pointer text-[#9FB3C8] text-[11px] leading-relaxed">
                  <input
                    type="checkbox"
                    checked={lgpdConsent}
                    onChange={(e) => setLgpdConsent(e.target.checked)}
                    className="mt-0.5 rounded border-[#223B57] text-[#2FA67A] focus:ring-0"
                  />
                  <span>
                    Concordo em compartilhar as coordenadas geográficas aproximadas do incidente em conformidade com a LGPD para alertar a comunidade de condutores CarCity.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#0B1A2E] text-[#9FB3C8] hover:text-white font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !lgpdConsent}
                  className="px-4 py-2.5 rounded-xl bg-[#E09F3E] hover:bg-[#B54708] text-[#0B1A2E] hover:text-white font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Enviando...' : 'Publicar Alerta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* Modal: Configuração de Cerca Eletrônica (Geofencing GPS) */}
      {/* ======================================================== */}
      {isGeofenceModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-[#12273F] border border-[#3A76C2] shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#223B57] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#3A76C2]/20 border border-[#3A76C2]/40 flex items-center justify-center text-[#5DA9E9]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Configurar Cerca Eletrônica (Geofencing)</h3>
                  <p className="text-[11px] text-[#9FB3C8]">
                    Centro: CEEP Newton Sucupira &bull; Setor F, Mussurunga, Salvador - BA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGeofenceModalOpen(false)}
                className="text-[#9FB3C8] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status em Tempo Real da Cerca */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                isFenceBreached
                  ? 'bg-[#E5484D]/15 border-[#E5484D] text-[#E5484D]'
                  : 'bg-[#2FA67A]/15 border-[#2FA67A] text-[#2FA67A]'
              }`}
            >
              <div className="flex items-center gap-2">
                {isFenceBreached ? (
                  <AlertTriangle className="w-4 h-4 text-[#E5484D]" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#2FA67A]" />
                )}
                <span className="font-bold text-xs">
                  {isFenceBreached
                    ? `Status: VEÍCULO FORA DO PERÍMETRO (${distanceToFenceKm.toFixed(1)} km do centro)`
                    : `Status: VEÍCULO SEGURO DENTRO DO RAIO (${distanceToFenceKm.toFixed(1)} km do centro)`}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/20 font-bold">
                Raio: {fenceRadiusInput} km
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateGeofenceConfig({
                  name: fenceNameInput,
                  radius_km: fenceRadiusInput,
                  action_on_breach: fenceActionInput,
                  notify_push: fencePushInput,
                  notify_sms: fenceSmsInput,
                  enabled: true,
                });
                setIsGeofenceModalOpen(false);
                setFeedbackMsg(`Cerca eletrônica "${fenceNameInput}" atualizada com raio de ${fenceRadiusInput} KM!`);
                setTimeout(() => setFeedbackMsg(null), 4000);
              }}
              className="space-y-4"
            >
              {/* Nome da Cerca */}
              <div>
                <label className="block text-[11px] font-bold text-[#9FB3C8] uppercase mb-1">
                  Nome da Cerca Eletrônica:
                </label>
                <input
                  type="text"
                  required
                  value={fenceNameInput}
                  onChange={(e) => setFenceNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1A2E] border border-[#223B57] text-white text-xs placeholder-[#64748B] focus:outline-none focus:border-[#5DA9E9]"
                  placeholder="Ex.: Perímetro CEEP Newton Sucupira (Mussurunga)"
                />
              </div>

              {/* Raio da Cerca (KM) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#9FB3C8] uppercase">
                    Raio de Segurança em Torno de Mussurunga:
                  </label>
                  <span className="text-xs font-mono font-bold text-[#5DA9E9] bg-[#5DA9E9]/10 px-2 py-0.5 rounded border border-[#5DA9E9]/20">
                    {fenceRadiusInput}.0 KM
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={fenceRadiusInput}
                  onChange={(e) => setFenceRadiusInput(Number(e.target.value))}
                  className="w-full accent-[#5DA9E9] cursor-pointer"
                />

                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 3, 5, 10, 15].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFenceRadiusInput(preset)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                        fenceRadiusInput === preset
                          ? 'bg-[#3A76C2] text-white border-[#3A76C2]'
                          : 'bg-[#0B1A2E] text-[#9FB3C8] border-[#223B57] hover:border-[#5DA9E9]'
                      }`}
                    >
                      {preset} km {preset === 5 && '(Padrão)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ação ao Violar Perímetro */}
              <div>
                <label className="block text-[11px] font-bold text-[#9FB3C8] uppercase mb-1.5">
                  Ação Automática ao Violar Raio:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFenceActionInput('ALERT_ONLY')}
                    className={`p-2.5 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                      fenceActionInput === 'ALERT_ONLY'
                        ? 'bg-[#3A76C2]/20 border-[#3A76C2] text-white'
                        : 'bg-[#0B1A2E] border-[#223B57] text-[#9FB3C8] hover:border-[#3A76C2]/50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1">
                      <BellRing className="w-3 h-3 text-[#5DA9E9]" />
                      Notificar
                    </div>
                    <span className="text-[10px] opacity-75 mt-1">Alerta sonoro e push instantâneo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFenceActionInput('LOCK_IGNITION')}
                    className={`p-2.5 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                      fenceActionInput === 'LOCK_IGNITION'
                        ? 'bg-[#E5484D]/20 border-[#E5484D] text-white'
                        : 'bg-[#0B1A2E] border-[#223B57] text-[#9FB3C8] hover:border-[#E5484D]/50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-[#E5484D]">
                      <Lock className="w-3 h-3" />
                      Bloqueio
                    </div>
                    <span className="text-[10px] opacity-75 mt-1">Corte preventivo da ignição</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFenceActionInput('DISPATCH_SECURITY')}
                    className={`p-2.5 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                      fenceActionInput === 'DISPATCH_SECURITY'
                        ? 'bg-[#E09F3E]/20 border-[#E09F3E] text-white'
                        : 'bg-[#0B1A2E] border-[#223B57] text-[#9FB3C8] hover:border-[#E09F3E]/50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-[#E09F3E]">
                      <Shield className="w-3 h-3" />
                      Apoio 24h
                    </div>
                    <span className="text-[10px] opacity-75 mt-1">Aciona suporte operacional</span>
                  </button>
                </div>
              </div>

              {/* Opções de Notificação */}
              <div className="p-3 rounded-xl bg-[#0B1A2E] border border-[#223B57] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9FB3C8] block">
                  Canais de Notificação:
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-[#9FB3C8] text-xs">
                  <input
                    type="checkbox"
                    checked={fencePushInput}
                    onChange={(e) => setFencePushInput(e.target.checked)}
                    className="rounded border-[#223B57] text-[#2FA67A] focus:ring-0"
                  />
                  <span>Notificações Push no celular do motorista</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[#9FB3C8] text-xs">
                  <input
                    type="checkbox"
                    checked={fenceSmsInput}
                    onChange={(e) => setFenceSmsInput(e.target.checked)}
                    className="rounded border-[#223B57] text-[#2FA67A] focus:ring-0"
                  />
                  <span>Alerta de emergência via SMS para números cadastrados</span>
                </label>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#223B57]">
                <button
                  type="button"
                  onClick={() => setIsGeofenceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#0B1A2E] text-[#9FB3C8] hover:text-white font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#3A76C2] hover:bg-[#2B5A96] text-white font-bold text-xs shadow transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar Cerca Eletrônica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
