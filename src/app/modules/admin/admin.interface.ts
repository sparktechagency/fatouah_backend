import { USER_ROLES } from '../../../enums/user';

export type IAdmin = {
  name: string;
  email: string;
  password: string;
  status: 'active' | 'delete';
  role: USER_ROLES;
};
