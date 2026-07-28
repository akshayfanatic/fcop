import { z } from 'zod';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 5;
export const MAX_PAGE_SIZE = 100;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE)
});

export type PaginationInput = z.infer<typeof paginationQuerySchema>;

export type PaginationMeta = PaginationInput & {
  totalItems: number;
  totalPages: number;
};

export type PaginatedData<TItem> = {
  items: TItem[];
  pagination: PaginationMeta;
};

export const getPaginationOffset = ({ page, pageSize }: PaginationInput) => (page - 1) * pageSize;

export const createPaginatedData = <TItem>({
  items,
  page,
  pageSize,
  totalItems
}: PaginationInput & {
  items: TItem[];
  totalItems: number;
}): PaginatedData<TItem> => ({
  items,
  pagination: {
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize)
  }
});
