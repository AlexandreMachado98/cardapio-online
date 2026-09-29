const fs = require('fs');
let code = fs.readFileSync('src/app/entregador/[id]/page.tsx', 'utf8');

const target1 = `          try {
            await fetch(\`/api/pedidos/\${order.id}/location\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat, lng }),
            });`;

const replacement1 = `          const now = Date.now();
          const lastSent = lastSentRef.current;
          const movedMeters = getDistanceMeters(lastSent.lat, lastSent.lng, lat, lng);
          const timeElapsed = now - lastSent.time;
          
          if (movedMeters >= 5 || timeElapsed >= 10000 || lastSent.time === 0) {
            lastSentRef.current = { lat, lng, time: now };
            try {
              await fetch(\`/api/pedidos/\${order.id}/location\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lng }),
              });`;

code = code.replace(target1, replacement1);

const target2 = `          } catch (e) {
            console.error('Erro ao transmitir GPS', e);
          }
        },`;

const replacement2 = `          } catch (e) {
            console.error('Erro ao transmitir GPS', e);
          }
          }
        },`;

code = code.replace(target2, replacement2);

const target3 = `export default function MotoboyPage() {`;

const replacement3 = `// Helper to calculate distance in meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function MotoboyPage() {
  const lastSentRef = React.useRef({ lat: 0, lng: 0, time: 0 });`;

code = code.replace(target3, replacement3);

fs.writeFileSync('src/app/entregador/[id]/page.tsx', code);
