import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'jenna_user_id';

export function useUser() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let storedUserId = localStorage.getItem(USER_ID_KEY);
    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem(USER_ID_KEY, storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  return userId;
}
