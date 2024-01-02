import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.input';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';
import { Dish } from './entities/dish.entity';
import { User } from '../users/entities/user.entity';
import { instanceArrToObjArr } from '../common/json/json.util';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.input';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.input';
import { errorMsg, successMsg } from '../common/msg/msg.util';

export class DishService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
    private readonly restaurantRepository: RestaurantRepository
  ) {}

  async createDish(
    { name, description, price, restaurantId, options }: CreateDishInput,
    owner: User
  ): Promise<CreateDishOutput> {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const verifyOutput = await this.restaurantRepository.verifyOwner(
          restaurantId,
          owner.id
        );

        if (!verifyOutput.ok) {
          return verifyOutput;
        }

        const { restaurant } = verifyOutput;

        /*
         이유는 정확히 모르겠으나 options 가 넘어올때 console.log 를 찍어보면 다음과
         같이 표시된다
         [ name: 'Quantity', choices: [ '1', '2', '3' ], extra: 3 ]

         아래와 같이 표기가 되어야 json 으로 정상적으로 변환이 된다
         { name: 'Quantity', choices: [ '1', '2', '3' ], extra: 3 }

         왜 []로 묶이는지 아직 정확한 원인은 찾지 못하였으나, []로 묶이면 json 문자열로
         변환이 이루어지지 않는 문제를 확인

         이를 수정하기 위해서 json.util.ts에 instance 를 object로 변환하는 코드를 작성
         하였고 이를 이용하여 object 로 수정후 json을 저장하도록 변경

         일단 변경해서 저장하면 데이터를 가져오는 부분에서는 부가 작업이 없어도
         별 문제없이 데이터를 가져오는것으로 확인됨
         */
        const convertOptions = instanceArrToObjArr(options);

        /*
          type orm 에서 transaction 사용시 save(insert / update) 에서는 명시적으로 transaction 을 지정하지 않아도 transaction 이 설정되어 실행된다
          이때문에 현재 코드처럼 save 외부에 transaction 을 설정할 경우 다음과 같이 transaction 이 실행된다

          START TRANSACTION
          sql1
          START TRANSACTION
          sql2
          COMMIT
          COMMIT

          아직까지 typeorm 에서 transaction propagation 이 어떻게 수행되는지 파악은 못한 상태이나 단일 transaction 으로 실행되는
          것이 바람직하기 때문에 repository.save 대신 entityManager.save 를 이용한다
         */
        await entityManager.save(Dish, this.dishes.create({
          name,
          description,
          price,
          restaurant,
          options: convertOptions,
        }));

        return successMsg();
      });
    } catch (e) {
      return errorMsg(e);
    }
  }

  async editDish(
    createDishInput: EditDishInput,
    owner: User
  ): Promise<EditDishOutput> {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const dish = await this.dishes.findOne({
          where: { id: createDishInput.dishId },
        });

        if (!dish) {
          return errorMsg('Dish Not Found');
        }

        await this.restaurantRepository.verifyOwner(dish.restaurantId, owner.id);
        const convertOptions = instanceArrToObjArr(createDishInput.options);

        // omitted - 해당 property 제외
        const {dishId: omitted, ...updateParam} = createDishInput;

        await entityManager.update(Dish, { id: createDishInput.dishId }, {
            ...updateParam,
            options: convertOptions,
        });

        return successMsg();
      });
    } catch (e) {
      return errorMsg(e);
    }
  }

  async deleteDish(
    { dishId }: DeleteDishInput,
    owner: User
  ): Promise<DeleteDishOutput> {
    try {
      return await this.dataSource.transaction(async () => {
        const dish = await this.dishes.findOne({ where: { id: dishId } });

        if (!dish) {
          return errorMsg('Dish Not Found');
        }

        const verifyOutput = await this.restaurantRepository.verifyOwner(dish.restaurantId, owner.id);
        if (!verifyOutput.ok) {
          return verifyOutput;
        }

        // delete 호출시에는 transaction 을 별도로 호출하지 않음
        await this.dishes.delete(dishId);
        return successMsg();
      });
    } catch (e) {
      return errorMsg(e);
    }
  }
}
