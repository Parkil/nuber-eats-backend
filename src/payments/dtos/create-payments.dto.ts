import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { Payment } from '../entities/payment.entity';
import { CoreOutput } from '../../common/dtos/output.dto';
import { IsNumber } from 'class-validator';

@InputType()
export class CreatePaymentsInput extends PickType(
  Payment,
  ['transactionId'],
  InputType
) {
  @Field(() => Number)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class CreatePaymentsOutput extends CoreOutput {}
