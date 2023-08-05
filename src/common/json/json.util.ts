const instanceToObj = (instance: any) => {
  const result = {};
  for (const prop in instance) {
    if (instance.hasOwnProperty(prop)) {
      result[prop] = instance[prop];
    }
  }
  return result;
};

export const instanceArrToObjArr = (instanceArr: any[]) => {
  return instanceArr.map((instance) => instanceToObj(instance));
};
