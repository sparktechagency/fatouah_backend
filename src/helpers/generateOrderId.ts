import { Order } from '../app/modules/order/order.model';

export const generateOrderId = async (): Promise<string> => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;

  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  const orderCount = await Order.countDocuments({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  const serial = String(orderCount + 1).padStart(4, '0');

  const orderId = `ORD-${dateString}-${serial}`;

  return orderId;
};
