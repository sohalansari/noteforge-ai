export const formatBytes = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
export const formatDate = (date: Date | string) => new Date(date).toLocaleDateString();
