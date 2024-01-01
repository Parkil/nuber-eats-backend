import { CoreOutput } from '../../common/dtos/output.dto';
import { Restaurant } from '../entities/restaurant.entity';

export class VerifyOutput extends CoreOutput {
  restaurant?: Restaurant;
}
