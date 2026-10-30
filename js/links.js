const coord = ({ lat, lng }) => `${lat},${lng}`;

export const linkInstagram = (instagram) => `https://www.instagram.com/${encodeURIComponent(instagram)}/`;

/** Foto de perfil via unavatar.io; sem foto, responde 404 (fallback=false) e o cartão a omite. */
export const fotoInstagram = (instagram) =>
  `https://unavatar.io/instagram/${encodeURIComponent(instagram)}?fallback=false`;

/** Apps de rota oferecidos ao clicar na coordenada. */
export function linksDeRota(empresa) {
  const { lat, lng, nome } = empresa;
  const nomeUrl = encodeURIComponent(nome);
  return [
    { app: 'Google Maps', href: `https://www.google.com/maps/search/?api=1&query=${coord(empresa)}` },
    { app: 'Waze', href: `https://waze.com/ul?ll=${coord(empresa)}&navigate=yes` },
    {
      app: 'Uber',
      href: `https://m.uber.com/ul/?action=setPickup&pickup=my_location`
        + `&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${nomeUrl}`,
    },
    { app: 'Apple Maps', href: `https://maps.apple.com/?ll=${coord(empresa)}&q=${nomeUrl}` },
  ];
}
