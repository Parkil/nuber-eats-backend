import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Order } from '../entites/order.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class TakeOrderInput extends PickType(Order, ['id'], InputType) {}

@ObjectType()
export class TakeOrderOutput extends CoreOutput {}
