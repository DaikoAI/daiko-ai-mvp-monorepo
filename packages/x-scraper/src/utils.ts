/**
 * Generates a random delay within a specified range.
 * @param min Minimum delay in milliseconds.
 * @param max Maximum delay in milliseconds.
 * @returns A random integer between min and max (inclusive).
 */
export const randomDelay = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
