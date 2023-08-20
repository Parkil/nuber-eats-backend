import { CoreOutput } from '../../common/dtos/output.dto';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';
import { Order, OrderStatus } from '../entites/order.entity';

@InputType()
export class ViewOrdersInput {
  @Field(() => OrderStatus, { nullable: true })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

@ObjectType()
export class ViewOrdersOutput extends CoreOutput {
  @Field(() => [Order], { nullable: true })
  orders?: Order[];
}
