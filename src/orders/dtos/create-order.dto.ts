import { CoreOutput } from '../../common/dtos/output.dto';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, ValidateNested } from 'class-validator';
import { OrderItemOption } from '../entites/order-item.entity';

@InputType()
class CreateOrderItemInput {
  @Field(() => Number)
  @IsNumber()
  dishId: number;

  @Field(() => [OrderItemOption], { nullable: true })
  options?: OrderItemOption[];
}

@InputType()
export class CreateOrderInput {
  @Field(() => Number)
  @IsNumber()
  restaurantId: number;

  @Field(() => [CreateOrderItemInput])
  @ValidateNested({ each: true })
  items: CreateOrderItemInput[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}
