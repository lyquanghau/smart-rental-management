import { useEffect, useState } from 'react';
import { getRooms } from '../services/roomService.js';

const statusLabels = {
  available: 'Trống',
  occupied: 'Đã thuê',
  maintenance: 'Bảo trì',
};

export function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRooms() {
      try {
        const data = await getRooms();
        setRooms(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadRooms();
  }, []);

  return (
    <section>
      <h1>Danh sách phòng</h1>

      {isLoading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="room-grid">
        {rooms.map((room) => (
          <article className="room-card" key={room._id}>
            <div>
              <h2>{room.name}</h2>
              <p>Tầng {room.floor}</p>
            </div>
            <span className={`status status-${room.status}`}>
              {statusLabels[room.status] || room.status}
            </span>
            <strong>{room.price.toLocaleString('vi-VN')}đ/tháng</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
