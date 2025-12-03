import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

interface CargoLocation {
  cargoId: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2641/2641634.png',
  iconSize: [45, 45],  
  iconAnchor: [22, 22],  
  popupAnchor: [0, -25],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [50, 50]
});

const AdminDashboard: React.FC = () => {
  const centerPosition: [number, number] = [41.0082, 28.9784];
  const [cargos, setCargos] = useState<Record<number, CargoLocation>>({});

  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      debug: () => {},
    });

    stompClient.onConnect = (frame: any) => {
      console.log('✅ WebSocket Bağlandı: ' + frame);

      stompClient.subscribe('/topic/all-cargos', (message) => {
        if (message.body) {
          const newLocation: CargoLocation = JSON.parse(message.body);
          
          setCargos((prevCargos) => ({
            ...prevCargos,
            [newLocation.cargoId]: newLocation
          }));
        }
      });
    };

    stompClient.onStompError = (frame: any) => {
      console.error('Broker reported error', frame);
    };

    stompClient.activate();

    // Component kapanırsa bağlantıyı kes (Cleanup)
    return () => {
      stompClient.deactivate();
      console.log("❌ Bağlantı kesildi");
    };
  }, []);

  const activeCargoList = Object.values(cargos);

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      
      <header style={{ 
        backgroundColor: '#1e272e', 
        color: 'white', 
        padding: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        zIndex: 1000 
      }}>
        <h2 style={{ margin: 0 }}>🚚 Logistic following system</h2>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ backgroundColor: '#05c46b', padding: '5px 15px', borderRadius: '4px', fontWeight: 'bold' }}>
            active cargos: {activeCargoList.length}
          </span>
        </div>
      </header>

      <div style={{ flex: 1 }}>
        <MapContainer center={centerPosition} zoom={11} scrollWheelZoom={true}>
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {activeCargoList.map((cargo) => (
            <Marker 
              key={cargo.cargoId} 
              position={[cargo.latitude, cargo.longitude]} 
              icon={truckIcon}
            >
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ fontSize: '1.1em' }}>Araç #{cargo.cargoId}</strong>
                  <hr style={{ margin: '5px 0' }}/>
                  <div>Enlem: {cargo.latitude.toFixed(4)}</div>
                  <div>Boylam: {cargo.longitude.toFixed(4)}</div>
                  <div style={{ fontSize: '0.8em', color: 'gray', marginTop: '5px' }}>
                    {new Date(cargo.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        </MapContainer>
      </div>
    </div>
  );
}

export default AdminDashboard;