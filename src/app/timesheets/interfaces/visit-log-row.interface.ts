import { IVisitLogCell } from './visit-log-cell.interface';
import { IUserTermInfo } from './visit-log-term.interface';

export interface IVisitLogRow {
  id: number;
  isActive: boolean;
  startDate: string;
  finishDate: string;
  termUserInfo: IUserTermInfo;
  visitLogCells: IVisitLogCell[];
}
