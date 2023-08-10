import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { IsNumber, IsString, Length, ValidateNested } from 'class-validator';
import { Restaurant } from '../../restaurnats/entities/restaurant.entity';

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
export class DishChoice {
  @Field(() => String)
  @IsString()
  name: string;

  @Field(() => Number, { nullable: true })
  @IsNumber()
  extra?: number;
}

@InputType('DishOptionInputType')
@ObjectType()
export class DishOption {
  @Field(() => String)
  @IsString()
  name: string;

  @Field(() => [DishChoice], { nullable: true })
  @ValidateNested({ each: true })
  choices?: DishChoice[];

  @Field(() => Number, { nullable: true })
  @IsNumber()
  extra?: number;
}

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Field(() => String)
  @Column({ unique: true })
  @IsString()
  @Length(5, 10)
  name: string;

  @Field(() => Number)
  @Column()
  @IsNumber()
  price: number;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  photo?: string;

  @Field(() => String)
  @Column()
  @IsString()
  @Length(5, 140)
  description: string;

  @Field(() => Restaurant)
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menu, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  // 구조가 정형화된 데이터면 db 테이블로 가져가는것이 맞지만, 주문 옵션은 음식에 따라 비정형으로 구성이 될수 있기 때문에 이렇게 가져가는것도 하나의 방법이라고 본다
  @Field(() => [DishOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  @ValidateNested({ each: true })
  options?: DishOption[];
}
