const RAIO_TERRA_KM = 6371;
const radianos = (graus) => (graus * Math.PI) / 180;

/** Distância em linha reta (fórmula de haversine), igual à usada no banco. */
export function distanciaKm(origem, destino) {
  const dLat = radianos(destino.lat - origem.lat);
  const dLng = radianos(destino.lng - origem.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radianos(origem.lat)) * Math.cos(radianos(destino.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(a));
}

export function formatarDistancia(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString('pt-BR', { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
}

export function obterPosicao() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Seu navegador não oferece localização.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      () => reject(new Error('Não foi possível obter sua localização.')),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}
