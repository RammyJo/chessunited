/* Generates public/images/world-map.svg — an equirectangular land outline in the
 * club's azure palette — and research/map-markers.json with percentage positions
 * for the Chess United Global markers used by src/pages/about.astro.
 * Dev-time only: run `node scripts/make_world_map.mjs` when the marker list
 * changes. Needs (npm install --no-save world-atlas topojson-client d3-geo). */
import { readFile, writeFile } from 'node:fs/promises';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import topo from '../node_modules/world-atlas/land-110m.json' with { type: 'json' };

const W = 1600;
const H = 800;
const projection = geoEquirectangular()
  .fitExtent(
    [
      [0, 0],
      [W, H],
    ],
    { type: 'Sphere' },
  )
  .precision(0.05);
const path = geoPath(projection);
const land = feature(topo, topo.objects.land);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="World map outline">
<rect width="${W}" height="${H}" fill="#ffffff"/>
<path d="${path(land)}" fill="#d7ecf7" stroke="#4bbced" stroke-width="1.5"/>
</svg>
`;
await writeFile(new URL('../public/images/world-map.svg', import.meta.url), svg);

const project = (lon, lat) => {
  const [x, y] = projection([lon, lat]);
  return { x: +((x / W) * 100).toFixed(2), y: +((y / H) * 100).toFixed(2) };
};

const markers = {
  vancouver: project(-123.12, 49.28),
  'san-fernando': project(120.32, 16.62),
  bombay: project(72.83, 19.08),
  jerusalem: project(35.21, 31.77),
  luzon: project(121.0, 14.6),
  visayas: project(124.0, 11.0),
  mindanao: project(125.1, 6.9),
};
await writeFile(
  new URL('../research/map-markers.json', import.meta.url),
  JSON.stringify(markers, null, 2) + '\n',
);
console.log(markers);
