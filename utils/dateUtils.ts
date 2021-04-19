const DaysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function dayOfWeek(date: Date): string {
  return DaysOfWeek[(date.getDay() + 6)%7]
}

export function addOneWeek(date: Date): Date {
  return new Date(new Date().setDate(date.getDate() + 7))
}
