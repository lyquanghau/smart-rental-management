import React, { useEffect, useState } from 'react';
import { RoomStatusBadge } from '../components/RoomStatusBadge.jsx';
import { getRooms } from '../services/roomService.js';

const statusOptions = [
  { value: '', label: 'Tất cả' },
  { value: 'available', label: 'Trống' },
  { value: 'occupied', label: 'Đã thuê' },
  { value: 'maintenance', label: 'Bảo trì' },
];

export function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

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

  const visibleRooms = statusFilter
    ? rooms.filter((room) => room.status === statusFilter)
    : rooms;

  return (
    <section>
      <div className="page-heading">
        <h1>Danh sách phòng</h1>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? <p>Đang tải dữ liệu...</p> : null}
      {error ? <p className="error-message">{error}</p> : null}

      {!isLoading && !error && visibleRooms.length === 0 ? (
        <p>Không có phòng phù hợp.</p>
      ) : null}

      {!error ? (
        <div className="room-grid">
          {visibleRooms.map((room) => (
            <article className="room-card" key={room._id}>
              <div>
                <h2>{room.name}</h2>
                <p>Tầng {room.floor}</p>
              </div>
              <RoomStatusBadge status={room.status} />
              <strong>{room.price.toLocaleString('vi-VN')}đ/tháng</strong>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
