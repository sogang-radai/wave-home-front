import { useEffect, useState } from 'react';
import { subscribeToast } from '../../lib/toast';

export function ToastHost() {
  const [message, setMessage] = useState('');

  useEffect(() => subscribeToast(setMessage), []);

  if (!message) return null;
  return (
    <div className="iot-toast" role="status">
      {message}
    </div>
  );
}
