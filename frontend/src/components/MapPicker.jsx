import { useRef, useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

// A canvas-based interactive "map" that lets users click to drop a pin
// and sets lat/lon coordinates. Shows a grid + decorative city blocks.
export default function MapPicker({ lat, lon, onChange }) {
  const canvasRef = useRef(null);
  const [pinPos, setPinPos] = useState(null);

  // Convert pixel to lat/lon in a demo coordinate range
  const BASE_LAT = 12.9716;
  const BASE_LON = 77.5946;
  const RANGE    = 0.08; // ~8 km range

  function pixelToCoords(x, y, w, h) {
    const latRange = RANGE;
    const lonRange = RANGE;
    const la = BASE_LAT + latRange / 2 - (y / h) * latRange;
    const lo = BASE_LON - lonRange / 2 + (x / w) * lonRange;
    return { lat: +la.toFixed(6), lon: +lo.toFixed(6) };
  }

  function coordsToPixel(la, lo, w, h) {
    const latRange = RANGE;
    const lonRange = RANGE;
    const x = ((lo - (BASE_LON - lonRange / 2)) / lonRange) * w;
    const y = ((BASE_LAT + latRange / 2 - la) / latRange) * h;
    return { x, y };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface-2').trim() || '#f8faff';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (let j = 0; j < H; j += 40) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke(); }

    // Decorative city blocks (random but seeded)
    const blocks = [
      [20,20,80,40],[120,20,70,50],[220,15,90,40],[340,20,60,45],[440,25,80,35],
      [20,90,100,50],[160,80,80,60],[280,85,70,55],[380,75,80,60],[20,175,90,45],
      [140,160,100,55],[270,155,80,50],[380,165,90,40],[50,130,60,30],[200,125,70,30],
    ];
    blocks.forEach(([x,y,w,h]) => {
      ctx.fillStyle = 'rgba(148,163,184,0.12)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(148,163,184,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    });

    // Roads
    ctx.strokeStyle = 'rgba(99,102,241,0.12)';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W/3, 0); ctx.lineTo(W/3, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2*W/3, 0); ctx.lineTo(2*W/3, H); ctx.stroke();

    // "Click to place pin" hint
    ctx.fillStyle = 'rgba(99,102,241,0.55)';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click to place issue location', W / 2, H - 12);

    // Existing pin
    if (pinPos) {
      const { x, y } = pinPos;
      // shadow
      ctx.fillStyle = 'rgba(99,102,241,0.2)';
      ctx.beginPath(); ctx.ellipse(x, y + 4, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
      // pin stem
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 24); ctx.stroke();
      // pin head
      ctx.fillStyle = '#6366f1';
      ctx.beginPath(); ctx.arc(x, y - 28, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y - 28, 3, 0, Math.PI * 2); ctx.fill();
    }
  }, [pinPos]);

  // Sync external lat/lon to pin position
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !lat || !lon) return;
    const W = canvas.width; const H = canvas.height;
    const { x, y } = coordsToPixel(lat, lon, W, H);
    if (x >= 0 && x <= W && y >= 0 && y <= H) setPinPos({ x, y });
  }, [lat, lon]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top)  * scaleY;
    setPinPos({ x, y });
    const { lat: la, lon: lo } = pixelToCoords(x, y, canvas.width, canvas.height);
    onChange(la, lo);
  };

  return (
    <div>
      <div className="map-picker" onClick={handleClick} title="Click to place issue pin">
        <canvas ref={canvasRef} width={560} height={220} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="map-coords">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Latitude</label>
          <input className="form-control" type="number" step="any" placeholder="Click map above"
            value={lat ?? ''} onChange={e => onChange(+e.target.value, lon)} />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Longitude</label>
          <input className="form-control" type="number" step="any" placeholder="Click map above"
            value={lon ?? ''} onChange={e => onChange(lat, +e.target.value)} />
        </div>
      </div>
    </div>
  );
}
