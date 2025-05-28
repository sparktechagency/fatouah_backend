import { IContact } from './contact.interface';
import { Contact } from './contact.model';

const createContactToDB = async (payload: IContact) => {
  // check if contact exist
  const existingContact = await Contact.findOne();
  if (existingContact) {
    const updatedData = { ...existingContact.toObject(), ...payload };

    const result = await Contact.findByIdAndUpdate(
      existingContact._id,
      updatedData,
      { new: true },
    );
    return result;
  } else {
    const result = await Contact.create(payload);
    return result;
  }
};

export const ContactServices = {
  createContactToDB,
};
