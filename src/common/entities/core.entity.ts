import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { IsNumber } from 'class-validator';

@ObjectType()
export class CoreEntity {
  @PrimaryGeneratedColumn()
  @IsNumber()
  @Field(() => Number) //@Field 를 지정하지 않은 변수는 GraphQL 에서 가져올 수 없다
  id: number;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
