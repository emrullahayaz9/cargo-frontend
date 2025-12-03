import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

interface CargoLocation {
  cargoId: number;
  trackingNumber: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2641/2641634.png',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [55, 55]
});

const UserTracking: React.FC = () => {
  const [trackingNo, setTrackingNo] = useState('');
  const [cargo, setCargo] = useState<CargoLocation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const clientRef = useRef<Client | null>(null);

  const startTracking = () => {
    if (!trackingNo.trim()) {
        alert("Please enter your tracking number.");
        return;
    }
    
    if (clientRef.current && clientRef.current.active) {
        console.log("Old connection closing...");
        clientRef.current.deactivate();
    }

    setCargo(null);
    setIsConnected(false);

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`✅ Connected to: /topic/tracking/${trackingNo.trim()}`);
        setIsConnected(true);
        
        client.subscribe(`/topic/tracking/${trackingNo.trim()}`, (message) => {
          if (message.body) {
            const data: CargoLocation = JSON.parse(message.body);
            setCargo(data);
            console.log("New Location:", data.trackingNumber);
          }
        });
      },
      onDisconnect: () => {
          console.log("❌ Bağlantı kesildi.");
          setIsConnected(false);
      },
      onStompError: (frame) => {
          console.error('Broker hatası:', frame.headers['message']);
      }
    });

    client.activate();
    clientRef.current = client;
  };

  // Sayfa kapandığında bağlantıyı temizle
  useEffect(() => {
    return () => { 
        if (clientRef.current) {
            clientRef.current.deactivate(); 
        }
    };
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      
      {/* Arama Alanı */}
      <div style={{ 
          padding: '25px', 
          background: 'linear-gradient(to right, #2c3e50, #3498db)', 
          textAlign: 'center', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
          zIndex: 1000,
          color: 'white'
      }}>
        <h2 style={{ margin: '0 0 15px 0', fontWeight: '600' }}>📦 Where is my cargo?</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', maxWidth: '500px', margin: '0 auto' }}>
            <input 
            type="text" 
            placeholder="Example: TR-001" 
            value={trackingNo}
            onChange={(e) => setTrackingNo(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && startTracking()}
            style={{ 
                padding: '12px', 
                fontSize: '16px', 
                flex: 1,
                borderRadius: '8px', 
                border: 'none',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
            }}
            />
            <button 
            onClick={startTracking}
            disabled={!trackingNo}
            style={{ 
                padding: '12px 25px', 
                background: trackingNo ? '#e67e22' : '#95a5a6', 
                color: 'white', 
                border: 'none', 
                cursor: trackingNo ? 'pointer' : 'not-allowed', 
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'background 0.3s ease',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            >
            {isConnected ? 'Takip Ediliyor...' : 'make an inquiry'}
            </button>
        </div>
        {isConnected && cargo && <p style={{marginTop: '10px', fontSize: '0.9rem'}}>✅ Canlı bağlantı aktif. Konum bekleniyor...</p>}
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        
        {isConnected && !cargo && (
             <div style={{
                 position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                 zIndex: 999, background: 'rgba(255,255,255,0.9)', padding: '20px', borderRadius: '10px',
                 boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
             }}>
                 <h3 style={{color: '#2c3e50', margin: 0}}>📡 Sinyal Bekleniyor...</h3>
                 <p style={{color: '#7f8c8d', margin: '10px 0 0 0'}}>Araç hareket ettiğinde haritada belirecek.</p>
             </div>
        )}

        <MapContainer center={[41.0082, 28.9784]} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer 
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          />
          
          {cargo && (
            <Marker position={[cargo.latitude, cargo.longitude]} icon={truckIcon}>
              <Popup>
                <div style={{textAlign: 'center', minWidth: '150px'}}>
                    <strong style={{fontSize: '1.2em', color: '#e67e22', display: 'block', marginBottom: '5px'}}>
                        {cargo.trackingNumber}
                    </strong> 
                    <span style={{background: '#27ae60', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8em'}}>
                        Yolda 🚚
                    </span>
                    <hr style={{margin: '10px 0', borderTop: '1px solid #eee'}}/>
                    <div style={{textAlign: 'left', fontSize: '0.9em', color: '#34495e'}}>
                        <div>📍 Enlem: {cargo.latitude.toFixed(4)}</div>
                        <div>📍 Boylam: {cargo.longitude.toFixed(4)}</div>
                    </div>
                    <div style={{ fontSize: '0.8em', color: '#7f8c8d', marginTop: '10px', fontStyle: 'italic' }}>
                        🕒 Son Sinyal: {new Date(cargo.timestamp).toLocaleTimeString()}
                    </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default UserTracking;