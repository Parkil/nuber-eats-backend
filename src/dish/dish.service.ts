import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';
import { Dish } from './entities/dish.entity';
import { User } from '../users/entities/user.entity';
import { instanceArrToObjArr } from '../common/json/json.util';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.input';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.input';

export class DishService {
  constructor(
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
    private readonly restaurants: RestaurantRepository
  ) {}

  async createDish(
    { name, description, price, restaurantId, options }: CreateDishInput,
    owner: User
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.verifyOwner(
        restaurantId,
        owner.id
      );
      /*
       이유는 정확히 모르겠으나 options 가 넘어올때 console.log 를 찍어보면 다음과
       같이 표시된다
       [ name: 'Quntity', choices: [ '1', '2', '3' ], extra: 3 ]
        
       아래와 같이 표기가 되어야 json 으로 정상적으로 변환이 된다 
       { name: 'Quntity', choices: [ '1', '2', '3' ], extra: 3 }
       
       왜 []로 묶이는지 아직 정확한 원인은 찾지 못하였으나, []로 묶이면 json 문자열로 
       변환이 이루어지지 않는 문제를 확인
       
       이를 수정하기 위해서 json.util.ts에 instance 를 object로 변환하는 코드를 작성
       하였고 이를 이용하여 object 로 수정후 json을 저장하도록 변경
       
       일단 변경해서 저장하면 데이터를 가져오는 부분에서는 부가 작업이 없어도
       별 문제없이 데이터를 가져오는것으로 확인됨
       */
      const convertOptions = instanceArrToObjArr(options);
      await this.dishes.save(
        this.dishes.create({
          name,
          description,
          price,
          restaurant,
          options: convertOptions,
        })
      );

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  async editDish(
    createDishInput: EditDishInput,
    owner: User
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: createDishInput.dishId },
      });

      if (!dish) {
        throw 'Dish Not Found';
      }

      await this.restaurants.verifyOwner(dish.restaurantId, owner.id);
      const convertOptions = instanceArrToObjArr(createDishInput.options);
      await this.dishes.save([
        {
          id: createDishInput.dishId,
          ...createDishInput,
          options: convertOptions,
        },
      ]);

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  async deleteDish(
    { dishId }: DeleteDishInput,
    owner: User
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne({ where: { id: dishId } });

      if (!dish) {
        throw 'Dish Not Found';
      }

      await this.restaurants.verifyOwner(dish.restaurantId, owner.id);
      await this.dishes.delete(dishId);

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }
}
