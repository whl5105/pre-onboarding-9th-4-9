import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';

import instance from '../apis/instance';
import { LIMIT, TODAY } from '../constants/constant';
import {
  IContextProps,
  IOrder,
  IOrderDataHooks,
  OrderType,
} from '../types/type';

const OrderContext = createContext({});

export const useOrderData = () => useContext(OrderContext) as IOrderDataHooks;

const OrderProvider = ({ children }: IContextProps) => {
  const [orderData, setOrderData] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [params, setParams] = useSearchParams();

  const total = orderData.length;
  const page = Number(params.get('page')) || 1;
  const offset = (Number(page) - 1) * LIMIT;

  const handleSortById = useCallback((order: OrderType) => {
    setOrderData(prev => {
      const newArray = [...prev];
      newArray.sort((current, next) =>
        order === 'asc' ? current.id - next.id : next.id - current.id
      );
      return newArray;
    });
  }, []);

  const handleSortByTime = useCallback((order: OrderType) => {
    setOrderData(prev => {
      const newArray = [...prev];
      newArray.sort((current, next) =>
        order === 'asc'
          ? new Date(current.transaction_time).getTime() -
            new Date(next.transaction_time).getTime()
          : new Date(next.transaction_time).getTime() -
            new Date(current.transaction_time).getTime()
      );
      return newArray;
    });
  }, []);

  useEffect(() => {
    instance
      .get('')
      .then(({ data }) =>
        setOrderData(
          data.filter(
            (order: IOrder) => order.transaction_time.split(' ')[0] === TODAY
          )
        )
      )
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!params.get('page')) {
      params.set('page', '1');
      setParams(params);
    }
  }, []);

  useEffect(() => {
    const sortType = params.get('sort');
    if (!isLoading && sortType) {
      const [standard, order] = sortType.split(':');
      if (standard === 'id') handleSortById(order as OrderType);
      if (standard === 'time') handleSortByTime(order as OrderType);
    }
  }, [isLoading]);

  return (
    <OrderContext.Provider
      value={{
        orderData,
        offset,
        total,
        page,
        handleSortById,
        handleSortByTime,
      }}>
      {children}
    </OrderContext.Provider>
  );
};

export { OrderProvider };
