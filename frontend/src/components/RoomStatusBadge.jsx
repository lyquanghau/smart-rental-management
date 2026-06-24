const statusLabels = {
  available: 'Trống',
  occupied: 'Đã thuê',
  maintenance: 'Bảo trì',
};

export function RoomStatusBadge({ status }) {
  return (
    <span className={`status status-${status}`}>
      {statusLabels[status] || status}
    </span>
  );
}
