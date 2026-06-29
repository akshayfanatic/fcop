export const toPort = (value: string | undefined, fallback: number) => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
};

export const toLogLevel = (value: string | undefined) => {
  const logLevel = value?.toLowerCase();

  if (logLevel === "all") {
    return "trace";
  }

  if (logLevel === "info" || logLevel === "error") {
    return logLevel;
  }

  return "info";
};

export const toOrigins = (value: string | undefined, fallback: string[]) => {
  const origins = value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins?.length ? origins : fallback;
};
