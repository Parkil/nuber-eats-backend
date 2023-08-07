import { CoreOutput } from '../../common/dtos/output.dto';
import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { Order } from '../entites/order.entity';

@InputType()
export class CreateOrderInput extends PickType(Order, ['items'], InputType) {
  @Field(() => Number)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}
