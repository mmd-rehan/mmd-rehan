import { useEffect, useState } from 'react'

const FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Dubai',
  hour: '2-digit',
  minute: '2-digit',
})

/** Local time in Dubai, refreshed on the minute. */
export function Clock() {
  const [time, setTime] = useState(() => FORMAT.format(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(FORMAT.format(new Date())), 60_000)
    return () => clearInterval(id)
  }, [])

  return <span id="clock">{time}</span>
}
