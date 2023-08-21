import { CoreOutput } from '../../common/dtos/output.dto';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { Order, OrderStatus } from '../entites/order.entity';

@InputType()
export class ViewOrdersInput {
  @Field(() => OrderStatus, { nullable: true })
  @IsOptional() // 해당 파라메터가 있을 때에만 Validation 을 처리하도록 설정
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

@ObjectType()
export class ViewOrdersOutput extends CoreOutput {
  @Field(() => [Order], { nullable: true })
  orders?: Order[];
}
