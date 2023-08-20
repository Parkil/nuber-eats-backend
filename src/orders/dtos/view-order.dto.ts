import { CoreOutput } from '../../common/dtos/output.dto';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { Order } from '../entites/order.entity';

@InputType()
export class ViewOrderInput {
  @Field(() => Number)
  @IsNumber()
  orderId: number;
}

@ObjectType()
export class ViewOrderOutput extends CoreOutput {
  @Field(() => Order, { nullable: true })
  orderInfo?: Order;
}
