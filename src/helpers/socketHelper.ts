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

// const socket = (io: Server) => {
//   io.on('connection', async (socket) => {
//     const riderId = socket.handshake.query.riderId as string;
//     console.log(riderId,"Rider ID")
//     logger.info(colors.blue(`Rider connected: ${riderId}`));

//     try {
//       await User.findByIdAndUpdate(riderId, { isOnline: true });
//     } catch (err) {
//       logger.error(`Error setting rider online: ${err}`);
//     }

//     socket.on('disconnect', async () => {
//       logger.info(colors.red(`Rider disconnected: ${riderId}`));
//       try {
//         await User.findByIdAndUpdate(riderId, { isOnline: false });
//       } catch (err) {
//         logger.error(`Error setting rider offline: ${err}`);
//       }
//     });

//     socket.on('rider_location_update', async ({ coordinates }) => {
//       try {
//         const updatedRider = await DeliveryServices.updateRiderLocation (riderId, coordinates);

//         // Emit update event to listeners
//         io.emit(`rider::${riderId}`, {
//           riderId,
//           coordinates: updatedRider.geoLocation?.coordinates,
//         });

//       } catch (err) {
//         logger.error(`Error updating rider location: ${err}`);
//       }
//     });
//   });
// };

const socket = (io: Server) => {
  io.on('connection', async (socket) => {
    const userId = socket.handshake.query.userId as string;

    try {
      const user = await User.findById(userId).select('role');
      if (!user) return;

      console.log(`${user.role} connected: ${userId}`);

      // ✅ যদি Rider হয়, isOnline update করো, location listen করো
      if (user.role === 'RIDER') {
        await User.findByIdAndUpdate(userId, { isOnline: true });

        socket.on('rider_location_update', async ({ coordinates }) => {
          try {
            const updated = await DeliveryServices.updateRiderLocation(userId, coordinates);
            io.emit(`rider::${userId}`, {
              riderId: userId,
              coordinates: updated.geoLocation?.coordinates,
            });
          } catch (err) {
            logger.error(`Error updating rider location: ${err}`);
          }
        });

        socket.on('disconnect', async () => {
          await User.findByIdAndUpdate(userId, { isOnline: false });
          console.log(`RIDER disconnected: ${userId}`);
        });
      }

      // ✅ যদি সাধারণ USER হয়, শুধু disconnect handle করো
      else if (user.role === 'USER') {
        socket.on('disconnect', () => {
          console.log(`USER disconnected: ${userId}`);
        });

        // চাইলে future এ user-specific socket event handle করো
        // socket.on('user_typing', ...)
      }

    } catch (err) {
      logger.error(`Socket connection error for ${userId}: ${err}`);
    }
  });
};



export const socketHelper = { socket };
