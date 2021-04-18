const DaysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function dayOfWeek(date: Date): string {
  return DaysOfWeek[date.getDay() - 1]
}
