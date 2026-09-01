export const LOGO_URL = `${import.meta.env.BASE_URL}revierpilot-logo.png`;

/** Das Logo ist beschnitten eingebunden — dieselbe Ausschnittwahl wie im Entwurf. */
export const logoCrop = {
  backgroundImage: `url(${LOGO_URL})`,
  backgroundSize: '256% auto',
  backgroundPosition: '51% 38%',
  backgroundRepeat: 'no-repeat' as const,
};
