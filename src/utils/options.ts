export type Option<TValue extends string> = {
  value: TValue;
  label: string;
};

export const getOptionLabel = <TValue extends string>(options: readonly Option<TValue>[], value: TValue) => options.find((option) => option.value === value)?.label ?? value;
