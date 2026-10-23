// Livery colours keyed by the API's constructorId (approximate, for quick
// scanning of tables). Recent former names are kept so older data still matches.
const TEAM_COLORS = {
  mercedes: '#00D7B6',
  ferrari: '#ED1131',
  red_bull: '#4781D7',
  mclaren: '#F47600',
  aston_martin: '#229971',
  alpine: '#00A1E8',
  williams: '#1868DB',
  rb: '#6C98FF',
  haas: '#B6BABD',
  audi: '#FF2D00',
  cadillac: '#C9A86A',
  sauber: '#52E252',
  alphatauri: '#4E7C9B',
  toro_rosso: '#469BFF',
  alfa: '#9B0000',
  renault: '#FFF500',
  racing_point: '#F596C8',
  force_india: '#F596C8',
};

export const teamColor = (constructorId) => TEAM_COLORS[constructorId] ?? 'var(--dim)';

// Small colour pill shown before a team or driver name. Decorative only:
// the team name is always written next to it.
export function teamSwatch(constructorId) {
  return `<span class="team-swatch" style="--team: ${teamColor(constructorId)}" aria-hidden="true"></span>`;
}
