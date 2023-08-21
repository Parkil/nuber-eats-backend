import { CoreOutput } from '../../common/dtos/output.dto';
import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Order } from '../entites/order.entity';

@InputType()
export class EditOrderInput extends PickType(
  Order,
  ['id', 'status'],
  InputType
) {}

@ObjectType()
export class EditOrderOutput extends CoreOutput {}
