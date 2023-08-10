import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Dish } from '../../dish/entities/dish.entity';
import { IsString, ValidateNested } from 'class-validator';

/*
  생각해보면 ORM 을 사용할때 반드시 한 DB 테이블당 1개의 entity 만 있어야 하는 이유는 없다
  여러 db 테이블을 묶어서 1개의 entity 로 사용할수도 있음
  [{"name":"SpicyLevel","choices":["1","2","3"],"extra":1},{"name":"Quntity","choices":["1","2","3"],"extra":3}]
 */

@InputType('OrderItemOptionInputType')
@ObjectType()
export class OrderItemOption {
  @Field(() => String)
  @IsString()
  name: string;

  @Field(() => String, { nullable: true })
  @IsString()
  choice: string;
}

@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItem extends CoreEntity {
  @ManyToOne(() => Dish, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  dish: Dish;

  @Field(() => [OrderItemOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  @ValidateNested({ each: true })
  options?: OrderItemOption[];
}
