import { useEffect, useState } from 'react'

const FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Dubai',
  hour: '2-digit',
  minute: '2-digit',
})

/** Local time in Dubai, refreshed on the minute. Empty until mounted so the
 *  prerendered HTML and the first client render agree. */
export function Clock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => setTime(FORMAT.format(new Date()))
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  return <span id="clock">{time}</span>
}
