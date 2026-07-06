const STORAGE_KEY = 'wavehome_room_order';

export function sortRoomsByLocalOrder(rooms) {
  try {
    const order = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(order) || order.length === 0) return rooms;
    return [...rooms].sort((a, b) => {
      const ai = order.indexOf(a.id);
      const bi = order.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  } catch {
    return rooms;
  }
}

export function saveRoomOrder(orderedIds) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderedIds));
  } catch {
    // ignore write errors (e.g. storage disabled)
  }
}
