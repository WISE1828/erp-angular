import { VisitTypesEnum } from '../enums/visit-types.enum';

export interface IVisitLogCell {
  id: number;
  date: string;
  visitType: VisitTypesEnum;
  termId: number;
}
