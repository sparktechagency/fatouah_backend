import colors from 'colors';
import { Server } from 'socket.io';
import { logger } from '../shared/logger';
import { User } from '../app/modules/user/user.model';
import { DeliveryServices } from '../app/modules/delivery/delivery.service';

const socket = (io: Server) => {
  io.on('connection', socket => {
    logger.info(colors.blue('A user connected'));

    // Rider sends riderId after connection
    socket.on('rider::online', async (riderId: string) => {
      try {
        socket.data.riderId = riderId;
        await User.findByIdAndUpdate(riderId, { isOnline: true });
        logger.info(colors.green(`Rider ${riderId} is now online`));
      } catch (err) {
        logger.error(colors.red(`Failed to mark rider online: ${err}`));
      }
    });

    // update rider location
    socket.on(
      'rider::location_update',
      async (payload: { riderId: string; coordinates: [number, number] }) => {
        try {
          const { riderId, coordinates } = payload;
          await DeliveryServices.updateRiderLocation(riderId, coordinates);
          logger.info(
            colors.cyan(
              `📍 Updated location for rider ${riderId} => ${coordinates}`,
            ),
          );
        } catch (error: any) {
          logger.error(
            colors.red(`❌ Location update failed: ${error.message}`),
          );
        }
      },
    );

    // Disconnect handler
    socket.on('disconnect', async () => {
      const riderId = socket.data.riderId;
      if (riderId) {
        try {
          await User.findByIdAndUpdate(riderId, { isOnline: false });
          logger.info(colors.yellow(`Rider ${riderId} is now offline`));
        } catch (err) {
          logger.error(colors.red(`Failed to mark rider offline: ${err}`));
        }
      } else {
        logger.warn(colors.gray('Disconnected socket had no riderId'));
      }
    });
  });
};

export const socketHelper = { socket };
