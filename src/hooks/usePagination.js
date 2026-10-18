import { useState, useMemo, useEffect } from 'react';

export default function usePagination(data, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  // A user-chosen page size (via Pagination's selector) overrides the default.
  const [customPageSize, setCustomPageSize] = useState(null);
  const pageSize = customPageSize ?? itemsPerPage;

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const page = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const goToPage = (target) => {
    setCurrentPage(Math.max(1, Math.min(target, totalPages)));
  };

  const setPageSize = (size) => {
    setCustomPageSize(Number(size) || itemsPerPage);
    setCurrentPage(1);
  };

  // Reset to page 1 when the data shrinks below the current page
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  return {
    currentPage: page,
    totalPages,
    paginatedData,
    goToPage,
    pageSize,
    setPageSize,
    totalItems: data.length,
    startIndex: data.length === 0 ? 0 : (page - 1) * pageSize + 1,
    endIndex: Math.min(page * pageSize, data.length),
  };
}
