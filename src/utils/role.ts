export const hasRole = (role: string, expectedRole: string) =>
  role
    .split(',')
    .map((item) => item.trim())
    .includes(expectedRole);
