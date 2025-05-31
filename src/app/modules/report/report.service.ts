import { User } from '../user/user.model';

const userReport = async () => {
  const result = await User.aggregate([
    {
      $match: { role: 'USER' },
    },
    {
      $lookup: {
        from: 'payments',
        let: { userIdStr: { $toString: '$_id' } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$userId', '$$userIdStr'],
              },
            },
          },
        ],
        as: 'payments',
      },
    },
    {
      $match: {
        'payments.0': { $exists: true },
      },
    },
    {
      $project: {
        name: 1,
        status: 1,
        joiningDate: '$createdAt',
        parcelSent: { $size: '$payments' },
      },
    },
  ]);

  return result;
};

const riderReport = async () => {
  const result = await User.aggregate([
    {
      $match: { role: 'RIDER' },
    },
  ]);
  return result;
};

export const ReportServices = {
  userReport,
  riderReport,
};
