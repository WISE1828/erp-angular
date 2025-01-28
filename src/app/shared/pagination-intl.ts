import { MatPaginatorIntl } from '@angular/material/paginator';

const rangeLabel = (page: number, pageSize: number, length: number) => {
  if (length == 0 || pageSize == 0) {
    return `0 из   ${length}`;
  }
  length = Math.max(length, 0);
  const startIndex = page * pageSize;
  const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
  return `${startIndex + 1} - ${endIndex} из ${length}`;
};
export function getPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Элементов на странице:';
  paginatorIntl.nextPageLabel = 'След. страница';
  paginatorIntl.previousPageLabel = 'Пред. страница';
  paginatorIntl.lastPageLabel = 'Последняя страница';
  paginatorIntl.firstPageLabel = 'Первая страница';
  paginatorIntl.getRangeLabel = rangeLabel;
  return paginatorIntl;
}
