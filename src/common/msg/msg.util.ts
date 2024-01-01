export const successMsg = (addInfo?: any) => {
  return {
    ok: true,
    ...addInfo,
  };
};

export const errorMsg = (errMsg: string) => {
  return {
    ok: false,
    error: errMsg,
  };
};
