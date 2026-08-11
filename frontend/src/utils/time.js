import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const IST_ZONE = 'Asia/Kolkata';

export function formatIst(value, format = 'DD MMM YYYY, hh:mm A') {
  if (!value) return 'No data';
  return dayjs(value).tz(IST_ZONE).format(format);
}

export function toInputDateTime(value) {
  return dayjs(value).tz(IST_ZONE).format('YYYY-MM-DDTHH:mm');
}

export function fromInputDateTime(value) {
  if (!value) return null;
  return dayjs.tz(value, IST_ZONE).format();
}

export function startOfToday() {
  return dayjs().tz(IST_ZONE).startOf('day').format();
}

export function endOfToday() {
  return dayjs().tz(IST_ZONE).endOf('day').format();
}

export function startOfYesterday() {
  return dayjs().tz(IST_ZONE).subtract(1, 'day').startOf('day').format();
}

export function endOfYesterday() {
  return dayjs().tz(IST_ZONE).subtract(1, 'day').endOf('day').format();
}
