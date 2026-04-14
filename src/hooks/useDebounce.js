import { useState, useEffect } from 'react'

export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  const debouncedId = useDebounce(userId, 400);
  useEffect(() => {
    if (debouncedId) { 
      userService.getBookings(debouncedId)
        .then(res => setBookings(res.data))
        .catch(err => console.error(err));
    }
  }, [debouncedId]);
  return debounced
}
