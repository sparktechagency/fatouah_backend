import colors from 'colors';
import { Server } from 'socket.io';
import { logger } from '../shared/logger';
import { User } from '../app/modules/user/user.model';
import { DeliveryServices } from '../app/modules/delivery/delivery.service';

// const socket = (io: Server) => {
//   io.on('connection', socket => {
//     logger.info(colors.blue('A user connected'));

//     //disconnect
//     socket.on('disconnect', () => {
//       logger.info(colors.red('A user disconnect'));
//     });
//   });
// };

const socket = (io: Server) => {
  io.on('connection', async (socket) => {
    const riderId = socket.handshake.query.riderId as string;
    console.log(riderId,"Rider ID")
    logger.info(colors.blue(`Rider connected: ${riderId}`));

    try {
      await User.findByIdAndUpdate(riderId, { isOnline: true });
    } catch (err) {
      logger.error(`Error setting rider online: ${err}`);
    }

    socket.on('disconnect', async () => {
      logger.info(colors.red(`Rider disconnected: ${riderId}`));
      try {
        await User.findByIdAndUpdate(riderId, { isOnline: false });
      } catch (err) {
        logger.error(`Error setting rider offline: ${err}`);
      }
    });

    socket.on('rider_location_update', async ({ coordinates }) => {
      try {
        const updatedRider = await DeliveryServices.updateRiderLocation (riderId, coordinates);

        // Emit update event to listeners
        io.emit(`rider::${riderId}`, {
          riderId,
          coordinates: updatedRider.geoLocation?.coordinates,
        });

      } catch (err) {
        logger.error(`Error updating rider location: ${err}`);
      }
    });
  });
};

export const socketHelper = { socket };
