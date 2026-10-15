import { useState, useMemo } from 'react';

export default function usePagination(data, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset to page 1 when data changes
  useMemo(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages]);

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    totalItems: data.length,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, data.length),
  };
}
